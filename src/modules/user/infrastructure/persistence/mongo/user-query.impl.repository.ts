import { EnumSearchPeople } from '@/modules/common/domain/enums/search.enum';
import { UserRecordProps, UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import {
  FindUsersForSearchInput,
  RoleFullProps,
  UserWithRole
} from '@/modules/user/domain/repositories/user.query.type';
import { UserMapper } from '@/modules/user/infrastructure/persistence/mongo/user.mapper';
import { UserModel } from '@/modules/user/infrastructure/persistence/mongo/user.model';
import { Collection, Db, Document, MongoClient } from 'mongodb';

type RoleModel = {
  _id: string;
  name: string;
  description: string;
  is_active: boolean;
  permission_ids: string[];
  created_at: Date;
  created_by_id: string | null;
  updated_at: Date;
  updated_by_id: string | null;
  deleted_at: Date | null;
  deleted_by_id: string | null;
};

export class UserQueryRepository implements UserQueryRepositoryPort {
  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: UserMapper
  ) {}

  get dbCollection(): Collection<UserModel> {
    return this.db.collection<UserModel>('users');
  }

  async findSafeUserById(id: string): Promise<UserSafeProps | null> {
    const result = await this.dbCollection.findOne(
      { _id: id, deleted_at: null },
      {
        projection: { password: 0, totp_secret: 0 }
      }
    );
    return result ? this.mapper.toResponse(result) : null;
  }

  async findSafeUserByUsername(username: string): Promise<UserSafeProps | null> {
    const result = await this.dbCollection.findOne(
      { username, deleted_at: null },
      {
        projection: { password: 0, totp_secret: 0 }
      }
    );
    return result ? this.mapper.toResponse(result) : null;
  }

  async findSafeUserByEmail(email: string): Promise<UserSafeProps | null> {
    const result = await this.dbCollection.findOne(
      { email, deleted_at: null },
      {
        projection: { password: 0, totp_secret: 0 }
      }
    );
    return result ? this.mapper.toResponse(result) : null;
  }

  async findUserByIdIncludeRole(id: string): Promise<UserWithRole | null> {
    const [record] = await this.dbCollection
      .aggregate<UserModel & { role?: RoleModel | null }>([
        { $match: { _id: id, deleted_at: null } },
        {
          $lookup: {
            from: 'roles',
            let: { roleId: '$role_id' },
            pipeline: [{ $match: { deleted_at: null, $expr: { $eq: ['$_id', '$$roleId'] } } }],
            as: '_r'
          }
        },
        { $addFields: { role: { $arrayElemAt: ['$_r', 0] } } },
        { $project: { _r: 0 } }
      ])
      .toArray();
    if (!record) return null;
    const { role, ...user } = record;
    const userResponse = this.mapper.toResponse(user);
    const roleResponse = role ? toRoleResponse(role) : null;
    return { ...userResponse, role: roleResponse };
  }

  async findUserByEmailIncludeRole(email: string): Promise<UserWithRole | null> {
    const [record] = await this.dbCollection
      .aggregate<UserModel & { role?: RoleModel | null }>([
        { $match: { email, deleted_at: null } },
        {
          $lookup: {
            from: 'roles',
            let: { roleId: '$role_id' },
            pipeline: [{ $match: { deleted_at: null, $expr: { $eq: ['$_id', '$$roleId'] } } }],
            as: '_r'
          }
        },
        { $addFields: { role: { $arrayElemAt: ['$_r', 0] } } },
        { $project: { _r: 0 } }
      ])
      .toArray();
    if (!record) return null;
    const { role, ...user } = record;
    const userResponse = this.mapper.toResponse(user);
    const roleResponse = role ? toRoleResponse(role) : null;
    return { ...userResponse, role: roleResponse };
  }

  async findManyUsersByIdsIncludeNameUsernameAvatar(ids: string[]): Promise<UserRecordProps[]> {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    const users = await this.dbCollection
      .aggregate<UserRecordProps>([
        { $match: { _id: { $in: uniqueIds }, deleted_at: null } },
        { $addFields: { id: '$_id' } },
        { $project: { _id: 0, id: 1, name: 1, username: 1, avatar: 1 } }
      ])
      .toArray();
    return users;
  }

  async findUsersForSearch({
    query,
    userId,
    people,
    limit,
    cursor,
    findFriendUserIds
  }: FindUsersForSearchInput): Promise<UserSafeProps[]> {
    const match: Record<string, unknown> = { deleted_at: null };

    if (query) {
      // tìm kiếm theo text trong các trường của user
      match['$text'] = {
        $search: query
      };
    }

    if (people && userId) {
      // tìm kiếm theo bạn bè và không phải bạn bè
      if ([EnumSearchPeople.FRIENDS, EnumSearchPeople.NOT_FRIENDS].includes(people)) {
        const friendIds = await findFriendUserIds(userId);
        match['_id'] = people === EnumSearchPeople.FRIENDS ? { $in: friendIds } : { $nin: friendIds };
      } else if (people === EnumSearchPeople.ONLY_ME) {
        // tìm kiếm theo chính mình
        match['_id'] = { $eq: userId };
      }
    }

    if (cursor) {
      // Ý nghĩa nghiệp vụ: đảm bảo khi nhiều post có cùng createdAt, việc paging vẫn không bị trùng/miss do dùng thêm _id làm tie-breaker.
      const cursorFilter = {
        $or: [
          { created_at: { $lt: cursor.raw().createdAt } },
          { created_at: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
        ]
      };
      match['$and'] = [match, cursorFilter];
    }

    const pipeline: Document[] = [
      { $match: match },
      { $sort: { created_at: -1, _id: -1 } },
      {
        $project: { password: 0, totp_secret: 0 }
      },
      { $limit: limit + 1 }
    ];
    const users = await this.dbCollection.aggregate<UserModel>(pipeline).toArray();
    return users.map((user) => this.mapper.toResponse(user) as UserSafeProps);
  }
}

function toRoleResponse(record: RoleModel): RoleFullProps {
  const response = {
    id: record._id,
    name: record.name,
    description: record.description,
    isActive: record.is_active,
    permissionIds: record.permission_ids,
    createdAt: record.created_at,
    createdById: record.created_by_id ?? null,
    updatedAt: record.updated_at,
    updatedById: record.updated_by_id ?? null,
    deletedAt: record.deleted_at ?? null,
    deletedById: record.deleted_by_id ?? null
  };
  return response;
}
