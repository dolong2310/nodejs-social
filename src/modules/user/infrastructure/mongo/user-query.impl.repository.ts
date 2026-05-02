import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import { IFindUsersForSearchInput, UserWithRole } from '@/modules/user/application/ports/queries/user-query.type';
import { UserRecordProps, UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { ESearchPeople } from '@/modules/common/domain/enums/search.enum';
import { UserMapper } from '@/modules/user/infrastructure/mappers/user.mapper';
import { UserModel } from '@/modules/user/infrastructure/mongo/user.model';
import { Collection, Db, Document, MongoClient } from 'mongodb';

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
      { _id: id },
      {
        projection: { password: 0, totpSecret: 0 }
      }
    );
    return result ? this.mapper.toResponse(result) : null;
  }

  async findSafeUserByUsername(username: string): Promise<UserSafeProps | null> {
    const result = await this.dbCollection.findOne(
      { username },
      {
        projection: { password: 0, totpSecret: 0 }
      }
    );
    return result ? this.mapper.toResponse(result) : null;
  }

  async findSafeUserByEmail(email: string): Promise<UserSafeProps | null> {
    const result = await this.dbCollection.findOne(
      { email },
      {
        projection: { password: 0, totpSecret: 0 }
      }
    );
    return result ? this.mapper.toResponse(result) : null;
  }

  async findUserByIdIncludeRole(id: string): Promise<UserWithRole | null> {
    const [record] = await this.dbCollection
      .aggregate<UserWithRole>([
        { $match: { _id: id } },
        { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: '_r' } },
        { $addFields: { role: { $arrayElemAt: ['$_r', 0] } } },
        { $project: { _r: 0 } },
        ...pipelineMapId('role')
      ])
      .toArray();
    if (!record) return null;
    return record;
  }

  async findUserByEmailIncludeRole(email: string): Promise<UserWithRole | null> {
    const [record] = await this.dbCollection
      .aggregate<UserWithRole>([
        { $match: { email } },
        { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: '_r' } },
        { $addFields: { role: { $arrayElemAt: ['$_r', 0] } } },
        { $project: { _r: 0 } },
        ...pipelineMapId('role')
      ])
      .toArray();
    if (!record) return null;
    return record;
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
          { createdAt: { $lt: cursor.raw().createdAt } },
          { createdAt: cursor.raw().createdAt, _id: { $lt: cursor.raw().id } }
        ]
      };
      match['$and'] = [match, cursorFilter];
    }

    const pipeline: Document[] = [
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $project: { password: 0, totpSecret: 0 }
      },
      { $limit: limit + 1 }
    ];
    return this.dbCollection.aggregate<UserSafeProps>(pipeline).toArray();
  }
}
