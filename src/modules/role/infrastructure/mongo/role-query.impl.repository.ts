import { RoleQueryRepositoryPort } from '@/modules/role/application/ports/queries/role-query.repository';
import { RoleWithPermissions } from '@/modules/role/application/ports/queries/role-query.type';
import { RoleMapper } from '@/modules/role/infrastructure/mongo/role.mapper';
import { RoleModel } from '@/modules/role/infrastructure/mongo/role.model';
import { Collection, Db, Document, MongoClient } from 'mongodb';

export class RoleQueryRepository implements RoleQueryRepositoryPort {
  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: RoleMapper
  ) {}

  get dbCollection(): Collection<RoleModel> {
    return this.db.collection<RoleModel>('roles');
  }

  async findRoleWithPermissionsById(id: string): Promise<RoleWithPermissions | null> {
    const pipeline: Document[] = [
      { $match: { _id: id } },
      {
        $lookup: {
          from: 'permissions',
          let: { ids: { $ifNull: ['$permissionIds', []] } },
          pipeline: [{ $match: { $expr: { $in: ['$_id', '$$ids'] } } }],
          as: '_permissionDocs'
        }
      },
      {
        $addFields: {
          permissions: {
            $map: {
              input: { $ifNull: ['$permissionIds', []] },
              as: 'pid',
              in: {
                $let: {
                  vars: {
                    d: {
                      $first: {
                        $filter: {
                          input: { $ifNull: ['$_permissionDocs', []] },
                          as: 'x',
                          cond: { $eq: ['$$x._id', '$$pid'] }
                        }
                      }
                    }
                  },
                  in: {
                    $cond: {
                      if: { $ne: ['$$d', null] },
                      then: {
                        id: '$$d._id',
                        name: '$$d.name',
                        description: '$$d.description',
                        path: '$$d.path',
                        method: '$$d.method',
                        module: '$$d.module',
                        createdAt: '$$d.createdAt',
                        updatedAt: '$$d.updatedAt'
                      },
                      else: null
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          permissions: {
            $filter: {
              input: '$permissions',
              as: 'p',
              cond: { $ne: ['$$p', null] }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          name: 1,
          description: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          permissions: 1
        }
      }
    ];

    const [doc] = await this.dbCollection.aggregate<RoleWithPermissions>(pipeline).toArray();
    return doc ?? null;
  }
}
