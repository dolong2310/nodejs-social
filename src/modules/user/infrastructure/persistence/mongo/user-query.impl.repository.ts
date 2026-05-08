import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/mongo/role.mapper'; // TODO: user module should not depend on role module
import { RoleModel } from '@/modules/authorization/infrastructure/persistence/mongo/role.model'; // TODO: user module should not depend on role module
import { ESearchPeople } from '@/modules/common/domain/enums/search.enum';
import { UserRecordProps, UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { IFindUsersForSearchInput, UserWithRole } from '@/modules/user/domain/repositories/user.query.type';
import { UserMapper } from '@/modules/user/infrastructure/persistence/mongo/user.mapper';
import { UserModel } from '@/modules/user/infrastructure/persistence/mongo/user.model';
import { Collection, Db, Document, MongoClient } from 'mongodb';

export class UserQueryRepository implements UserQueryRepositoryPort {
  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: UserMapper,
    protected readonly roleMapper: RoleMapper
  ) {}

  get dbCollection(): Collection<UserModel> {
    return this.db.collection<UserModel>('users');
  }

  async findSafeUserById(id: string): Promise<UserSafeProps | null> {
    const result = await this.dbCollection.findOne(
      { _id: id },
      {
        projection: { password: 0, totp_secret: 0 }
      }
    );
    return result ? this.mapper.toResponse(result) : null;
  }

  async findSafeUserByUsername(username: string): Promise<UserSafeProps | null> {
    const result = await this.dbCollection.findOne(
      { username },
      {
        projection: { password: 0, totp_secret: 0 }
      }
    );
    return result ? this.mapper.toResponse(result) : null;
  }

  async findSafeUserByEmail(email: string): Promise<UserSafeProps | null> {
    const result = await this.dbCollection.findOne(
      { email },
      {
        projection: { password: 0, totp_secret: 0 }
      }
    );
    return result ? this.mapper.toResponse(result) : null;
  }

  async findUserByIdIncludeRole(id: string): Promise<UserWithRole | null> {
    const [record] = await this.dbCollection
      .aggregate<
        UserModel & { role?: RoleModel | null }
      >([{ $match: { _id: id } }, { $lookup: { from: 'roles', localField: 'role_id', foreignField: '_id', as: '_r' } }, { $addFields: { role: { $arrayElemAt: ['$_r', 0] } } }, { $project: { _r: 0 } }])
      .toArray();
    if (!record) return null;
    const { role, ...user } = record;
    const userResponse = this.mapper.toResponse(user);
    const roleResponse = role ? this.roleMapper.toResponse(role) : null;
    return { ...userResponse, role: roleResponse };
  }

  async findUserByEmailIncludeRole(email: string): Promise<UserWithRole | null> {
    const [record] = await this.dbCollection
      .aggregate<
        UserModel & { role?: RoleModel | null }
      >([{ $match: { email } }, { $lookup: { from: 'roles', localField: 'role_id', foreignField: '_id', as: '_r' } }, { $addFields: { role: { $arrayElemAt: ['$_r', 0] } } }, { $project: { _r: 0 } }])
      .toArray();
    if (!record) return null;
    const { role, ...user } = record;
    const userResponse = this.mapper.toResponse(user);
    const roleResponse = role ? this.roleMapper.toResponse(role) : null;
    return { ...userResponse, role: roleResponse };
  }

  async findManyUsersByIdsIncludeNameUsernameAvatar(ids: string[]): Promise<UserRecordProps[]> {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    const users = await this.dbCollection
      .aggregate<UserRecordProps>([
        { $match: { _id: { $in: uniqueIds } } },
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
  }: IFindUsersForSearchInput): Promise<UserSafeProps[]> {
    const match: Record<string, unknown> = {};

    if (query) {
      // tìm kiếm theo text trong các trường của user
      match['$text'] = {
        $search: query
      };
    }

    if (people && userId) {
      // tìm kiếm theo bạn bè và không phải bạn bè
      if ([ESearchPeople.FRIENDS, ESearchPeople.NOT_FRIENDS].includes(people)) {
        const friendIds = await findFriendUserIds(userId);
        match['_id'] = people === ESearchPeople.FRIENDS ? { $in: friendIds } : { $nin: friendIds };
      } else if (people === ESearchPeople.ONLY_ME) {
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

/**
 * Util function pipeline to map _id to id
 */
export function pipelineMapId(...nested: string[]): Document[] {
  // TODO: Move to utils
  const out: Document[] = [];

  for (const field of nested) {
    out.push({
      $addFields: {
        [field]: {
          $let: {
            vars: { r: `$${field}` },
            in: {
              $cond: [
                { $eq: ['$$r', null] },
                null,
                {
                  $mergeObjects: [
                    {
                      $arrayToObject: {
                        $filter: {
                          input: { $objectToArray: '$$r' },
                          as: 'f',
                          cond: { $ne: ['$$f.k', '_id'] }
                        }
                      }
                    },
                    { id: '$$r._id' }
                  ]
                }
              ]
            }
          }
        }
      }
    });
  }

  out.push({ $addFields: { id: '$_id' } }, { $project: { _id: 0 } });
  return out;
}
