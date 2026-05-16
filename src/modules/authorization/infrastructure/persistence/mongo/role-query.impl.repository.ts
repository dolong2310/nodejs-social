import { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.type';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/mongo/role.mapper';
import { RoleModel } from '@/modules/authorization/infrastructure/persistence/mongo/role.model';
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
      { $match: { _id: id, deleted_at: null } },
      {
        $lookup: {
          from: 'permissions',
          let: { ids: { $ifNull: ['$permission_ids', []] } },
          pipeline: [{ $match: { deleted_at: null, $expr: { $in: ['$_id', '$$ids'] } } }],
          as: '_permissionDocs'
        }
      },
      {
        $addFields: {
          permissions: {
            $map: {
              input: { $ifNull: ['$permission_ids', []] },
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
                        createdAt: '$$d.created_at',
                        updatedAt: '$$d.updated_at'
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
          isActive: '$is_active',
          createdAt: '$created_at',
          updatedAt: '$updated_at',
          permissions: 1
        }
      }
    ];

    const [doc] = await this.dbCollection.aggregate<RoleWithPermissions>(pipeline).toArray();
    return doc ?? null;
  }
}
