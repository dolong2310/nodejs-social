import { RoleFullProps } from '@/modules/authorization/domain/entities/role.type';
import { EnumSearchPeople } from '@/modules/common/domain/enums/search.enum';
import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { Username } from '@/modules/common/domain/value-objects/username.value-object';
import { UserRecordProps, UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { FindUsersForSearchInput, UserWithRole } from '@/modules/user/domain/repositories/user.query.type';
import { UserMapper } from '@/modules/user/infrastructure/persistence/postgres/user.mapper';
import { UserModel } from '@/modules/user/infrastructure/persistence/postgres/user.model';
import type { Pool } from 'pg';

type UserWithRoleModel = UserModel & {
  joined_role_id: string | null;
  role_name: string | null;
  role_description: string | null;
  role_is_active: boolean | null;
  role_permission_ids: string[] | null;
  role_created_at: Date | null;
  role_updated_at: Date | null;
};

const roleJoin = `
  LEFT JOIN (
    SELECT
      r.id,
      r.name,
      r.description,
      r.is_active,
      r.created_at,
      r.updated_at,
      COALESCE(
        array_agg(rp.permission_id ORDER BY rp.position) FILTER (WHERE rp.permission_id IS NOT NULL),
        ARRAY[]::text[]
      ) AS permission_ids
    FROM roles r
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    WHERE r.deleted_at IS NULL
    GROUP BY r.id
  ) role ON role.id = u.role_id
`;

export class UserQueryRepository implements UserQueryRepositoryPort {
  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: UserMapper
  ) {}

  async findSafeUserById(id: string): Promise<UserSafeProps | null> {
    const result = await this.pool.query<UserModel>(
      `SELECT * FROM "users" WHERE "id" = $1 AND "deleted_at" IS NULL LIMIT 1`,
      [id]
    );
    const [record] = result.rows;
    return record ? this.toSafeUser(record) : null;
  }

  async findSafeUserByUsername(username: string): Promise<UserSafeProps | null> {
    const normalizedUsername = Username.normalize(username);
    if (!normalizedUsername) return null;

    const result = await this.pool.query<UserModel>(
      `SELECT * FROM "users" WHERE "username" = $1 AND "deleted_at" IS NULL LIMIT 1`,
      [normalizedUsername]
    );
    const [record] = result.rows;
    return record ? this.toSafeUser(record) : null;
  }

  async findSafeUserByEmail(email: string): Promise<UserSafeProps | null> {
    const result = await this.pool.query<UserModel>(
      `SELECT * FROM "users" WHERE "email" = $1 AND "deleted_at" IS NULL LIMIT 1`,
      [EmailAddress.normalize(email)]
    );
    const [record] = result.rows;
    return record ? this.toSafeUser(record) : null;
  }

  async findUserByIdIncludeRole(id: string): Promise<UserWithRole | null> {
    const result = await this.pool.query<UserWithRoleModel>(
      `
        SELECT
          u.*,
          role.id AS joined_role_id,
          role.name AS role_name,
          role.description AS role_description,
          role.is_active AS role_is_active,
          role.permission_ids AS role_permission_ids,
          role.created_at AS role_created_at,
          role.updated_at AS role_updated_at
        FROM users u
        ${roleJoin}
        WHERE u.id = $1 AND u.deleted_at IS NULL
        LIMIT 1
      `,
      [id]
    );
    const [record] = result.rows;
    return record ? this.toUserWithRole(record) : null;
  }

  async findUserByEmailIncludeRole(email: string): Promise<UserWithRole | null> {
    const result = await this.pool.query<UserWithRoleModel>(
      `
        SELECT
          u.*,
          role.id AS joined_role_id,
          role.name AS role_name,
          role.description AS role_description,
          role.is_active AS role_is_active,
          role.permission_ids AS role_permission_ids,
          role.created_at AS role_created_at,
          role.updated_at AS role_updated_at
        FROM users u
        ${roleJoin}
        WHERE u.email = $1 AND u.deleted_at IS NULL
        LIMIT 1
      `,
      [EmailAddress.normalize(email)]
    );
    const [record] = result.rows;
    return record ? this.toUserWithRole(record) : null;
  }

  async findManyUsersByIdsIncludeNameUsernameAvatar(ids: string[]): Promise<UserRecordProps[]> {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    const result = await this.pool.query<UserRecordProps>(
      `
        SELECT "id", "name", "username", "avatar"
        FROM "users"
        WHERE "id" = ANY($1::text[]) AND "deleted_at" IS NULL
      `,
      [uniqueIds]
    );
    return result.rows;
  }

  async findUsersForSearch({
    query,
    userId,
    people,
    limit,
    cursor,
    findFriendUserIds
  }: FindUsersForSearchInput): Promise<UserSafeProps[]> {
    const values: unknown[] = [];
    const conditions: string[] = ['"deleted_at" IS NULL'];

    if (query) {
      values.push(`%${query}%`);
      const param = `$${values.length}`;
      conditions.push(`("name" ILIKE ${param} OR "username" ILIKE ${param} OR "email" ILIKE ${param})`);
    }

    if (people && userId) {
      if ([EnumSearchPeople.FRIENDS, EnumSearchPeople.NOT_FRIENDS].includes(people)) {
        const friendIds = await findFriendUserIds(userId);
        if (people === EnumSearchPeople.FRIENDS && friendIds.length === 0) return [];

        if (friendIds.length > 0) {
          values.push(friendIds);
          const param = `$${values.length}`;
          conditions.push(
            people === EnumSearchPeople.FRIENDS ? `"id" = ANY(${param}::text[])` : `"id" <> ALL(${param}::text[])`
          );
        }
      } else if (people === EnumSearchPeople.ONLY_ME) {
        values.push(userId);
        conditions.push(`"id" = $${values.length}`);
      }
    }

    if (cursor) {
      const { id, createdAt } = cursor.raw();
      values.push(createdAt, id);
      conditions.push(
        `("created_at" < $${values.length - 1} OR ("created_at" = $${values.length - 1} AND "id" < $${values.length}))`
      );
    }

    values.push(limit + 1);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.pool.query<UserModel>(
      `
        SELECT *
        FROM "users"
        ${whereClause}
        ORDER BY "created_at" DESC, "id" DESC
        LIMIT $${values.length}
      `,
      values
    );

    return result.rows.map((record) => this.toSafeUser(record));
  }

  private toUserWithRole(record: UserWithRoleModel): UserWithRole {
    return {
      ...this.mapper.toResponse(record),
      role: this.toRole(record)
    };
  }

  private toSafeUser(record: UserModel): UserSafeProps {
    const { password, totpSecret, ...safe } = this.mapper.toResponse(record);
    void password;
    void totpSecret;
    return safe;
  }

  private toRole(record: UserWithRoleModel): RoleFullProps | null {
    if (!record.joined_role_id) return null;

    return {
      id: record.joined_role_id,
      name: record.role_name as string,
      description: record.role_description as string,
      isActive: record.role_is_active as boolean,
      permissionIds: record.role_permission_ids ?? [],
      createdAt: record.role_created_at as Date,
      updatedAt: record.role_updated_at as Date
    };
  }
}
