import { Entity as DomainEntity } from '@/modules/core/domain/entities/base.entity';
import {
  Options,
  Paginated,
  PaginatedQueryParams,
  RepositoryPort
} from '@/modules/core/domain/repositories/port.repository';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const idColumn = 'id';
const uppercaseLetterRegex = /[A-Z]/g;
const doubleQuoteRegex = /"/g;

const transactionStorage = new AsyncLocalStorage<PoolClient>();

type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

export abstract class PostgresRepositoryBase<
  Entity extends DomainEntity<unknown>,
  DbModel extends QueryResultRow
> implements RepositoryPort<Entity> {
  protected abstract tableName: string;

  protected constructor(
    protected readonly pool: Pool,
    protected readonly mapper: Mapper<Entity, DbModel>
  ) {}

  async findById(id: string, options?: Options): Promise<Entity | null> {
    const { clause, values } = this._buildWhere({ id } as unknown as Partial<Entity>, 1, options);
    const result = await this.query<DbModel>(
      `SELECT ${this._buildSelect(options)} FROM ${this._table()}${clause} LIMIT 1`,
      values
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async findOne(entity: Partial<Entity>, options?: Options): Promise<Entity | null> {
    const { clause, values } = this._buildWhere(entity, 1, options);
    const result = await this.query<DbModel>(
      `SELECT ${this._buildSelect(options)} FROM ${this._table()}${clause} LIMIT 1`,
      values
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async find(entity: Partial<Entity>, options?: Options): Promise<Entity[]> {
    const { clause, values } = this._buildWhere(entity, 1, options);
    const result = await this.query<DbModel>(
      `SELECT ${this._buildSelect(options)} FROM ${this._table()}${clause}`,
      values
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async findAll(options?: Options): Promise<Entity[]> {
    const { clause, values } = this._buildWhere({} as Partial<Entity>, 1, options);
    const result = await this.query<DbModel>(
      `SELECT ${this._buildSelect(options)} FROM ${this._table()}${clause}`,
      values
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async findAllByIds(ids: string[], options?: Options): Promise<Entity[]> {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return [];
    const deleted = this._buildDeletedCondition(options);
    const result = await this.query<DbModel>(
      `SELECT ${this._buildSelect(options)} FROM ${this._table()} WHERE ${this._column(
        idColumn
      )} = ANY($1::text[])${deleted.condition ? ` AND ${deleted.condition}` : ''}`,
      [uniqueIds, ...deleted.values]
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async findAllPaginated(params: PaginatedQueryParams, options?: Options): Promise<Paginated<Entity>> {
    const orderColumn = params.orderBy.field === true ? idColumn : this._toColumnName(params.orderBy.field);
    const orderDirection = params.orderBy.param === 'asc' ? 'ASC' : 'DESC';
    const { clause, values } = this._buildWhere({} as Partial<Entity>, 3, options);
    const [records, countResult] = await Promise.all([
      this.query<DbModel>(
        `SELECT ${this._buildSelect(options)} FROM ${this._table()}${clause} ORDER BY ${this._column(
          orderColumn
        )} ${orderDirection} OFFSET $1 LIMIT $2`,
        [params.offset, params.limit, ...values]
      ),
      this.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${this._table()}${clause}`, values)
    ]);

    return new Paginated<Entity>({
      count: Number(countResult.rows[0]?.count ?? 0),
      limit: params.limit,
      page: params.page,
      data: records.rows.map((record) => this.mapper.toDomain(record))
    });
  }

  async existsById(id: string, options?: Options): Promise<boolean> {
    const { clause, values } = this._buildWhere({ id } as unknown as Partial<Entity>, 1, options);
    const result = await this.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this._table()}${clause}) AS exists`,
      values
    );
    return result.rows[0]?.exists ?? false;
  }

  async count(entity?: Partial<Entity>, options?: Options): Promise<number> {
    const { clause, values } = this._buildWhere(entity ?? {}, 1, options);
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this._table()}${clause}`,
      values
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async insert(entity: Entity, options?: Options): Promise<Entity> {
    const record = this._withAuditOnInsert(this.mapper.toPersistence(entity), options);
    const { columns, values, placeholders } = this._buildInsert(record);
    const result = await this.query<DbModel>(
      `INSERT INTO ${this._table()} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return this.mapper.toDomain(result.rows[0] ?? record);
  }

  async insertMany(entities: Entity[], options?: Options): Promise<Entity[]> {
    if (entities.length === 0) return [];
    const inserted: Entity[] = [];
    await this.transaction(async () => {
      for (const entity of entities) {
        inserted.push(await this.insert(entity, options));
      }
    });
    return inserted;
  }

  async update(id: string, entity: Partial<Entity>, options?: Options): Promise<Entity | null> {
    const updateData = this._withAuditOnUpdate(this._toDbUpdate(entity), options);
    const { setClause, values } = this._buildSet(updateData, 2);
    const deleted = this._buildDeletedCondition(options);
    const result = await this.query<DbModel>(
      `UPDATE ${this._table()} SET ${setClause} WHERE ${this._column(idColumn)} = $1${
        deleted.condition ? ` AND ${deleted.condition}` : ''
      } RETURNING ${this._buildSelect(options)}`,
      [id, ...values, ...deleted.values]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async updateOne(id: string, entity: Partial<Entity>, options?: Options): Promise<void> {
    const updateData = this._withAuditOnUpdate(this._toDbUpdate(entity), options);
    const { setClause, values } = this._buildSet(updateData, 2);
    const deleted = this._buildDeletedCondition(options);
    await this.query(
      `UPDATE ${this._table()} SET ${setClause} WHERE ${this._column(idColumn)} = $1${
        deleted.condition ? ` AND ${deleted.condition}` : ''
      }`,
      [id, ...values, ...deleted.values]
    );
  }

  async updateMany(entity: Partial<Entity>, data: Partial<Entity>, options?: Options): Promise<number> {
    const updateData = this._withAuditOnUpdate(this._toDbUpdate(data), options);
    const { setClause, values } = this._buildSet(updateData, 1);
    const where = this._buildWhere(entity, values.length + 1, options);
    const result = await this.query(`UPDATE ${this._table()} SET ${setClause}${where.clause}`, [
      ...values,
      ...where.values
    ]);
    return result.rowCount ?? 0;
  }

  async deleteById(id: string, options?: Options): Promise<boolean> {
    if (options?.hardDelete) {
      const result = await this.query(`DELETE FROM ${this._table()} WHERE ${this._column(idColumn)} = $1`, [id]);
      return (result.rowCount ?? 0) > 0;
    }

    const deleted = this._buildDeletedCondition(options);
    const result = await this.query(
      `UPDATE ${this._table()}
       SET ${this._column('deleted_at')} = NOW(),
           ${this._column('deleted_by_id')} = $2,
           ${this._column('updated_at')} = NOW(),
           ${this._column('updated_by_id')} = $2
       WHERE ${this._column(idColumn)} = $1${deleted.condition ? ` AND ${deleted.condition}` : ''}`,
      [id, options?.actorId ?? null, ...deleted.values]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllByIds(ids: string[], options?: Options): Promise<boolean> {
    if (ids.length === 0) return false;
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return false;
    if (options?.hardDelete) {
      const result = await this.query(
        `DELETE FROM ${this._table()} WHERE ${this._column(idColumn)} = ANY($1::text[])`,
        [uniqueIds]
      );
      return (result.rowCount ?? 0) > 0;
    }

    const deleted = this._buildDeletedCondition(options);
    const result = await this.query(
      `UPDATE ${this._table()}
       SET ${this._column('deleted_at')} = NOW(),
           ${this._column('deleted_by_id')} = $2,
           ${this._column('updated_at')} = NOW(),
           ${this._column('updated_by_id')} = $2
       WHERE ${this._column(idColumn)} = ANY($1::text[])${deleted.condition ? ` AND ${deleted.condition}` : ''}`,
      [uniqueIds, options?.actorId ?? null, ...deleted.values]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async transaction<T>(handler: () => Promise<T> | T): Promise<T> {
    const existingClient = transactionStorage.getStore();
    if (existingClient) {
      return handler();
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await transactionStorage.run(client, async () => handler());
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  protected query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: readonly unknown[] = []
  ): Promise<QueryResult<T>> {
    const client: Queryable = transactionStorage.getStore() ?? this.pool;
    return client.query<T>(sql, [...params]);
  }

  protected _toColumnName(property: string): string {
    if (property === 'id') return idColumn;
    return property.replace(uppercaseLetterRegex, (letter) => `_${letter.toLowerCase()}`);
  }

  protected _toDbUpdate(data: Partial<Entity>): Partial<DbModel> {
    return Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value === undefined || key === 'id') return acc;
      acc[this._toColumnName(key)] = value;
      return acc;
    }, {}) as Partial<DbModel>;
  }

  private _buildWhere(filter: Partial<Entity>, startAt = 1, options?: Options): { clause: string; values: unknown[] } {
    const entries = Object.entries(filter).filter(([, value]) => value !== undefined);
    const values: unknown[] = [];
    const conditions = entries.map(([key, value], index) => {
      values.push(value);
      return `${this._column(this._toColumnName(key))} = $${startAt + index}`;
    });
    const deleted = this._buildDeletedCondition(options);
    if (deleted.condition) {
      conditions.push(deleted.condition);
      values.push(...deleted.values);
    }
    if (conditions.length === 0) return { clause: '', values: [] };
    return { clause: ` WHERE ${conditions.join(' AND ')}`, values };
  }

  private _buildInsert(record: DbModel): { columns: string; values: unknown[]; placeholders: string } {
    const entries = Object.entries(record).filter(([, value]) => value !== undefined);
    const columns = entries.map(([key]) => this._column(key)).join(', ');
    const values = entries.map(([, value]) => value);
    const placeholders = entries.map((_, index) => `$${index + 1}`).join(', ');
    return { columns, values, placeholders };
  }

  private _buildSet(data: Partial<DbModel>, startAt: number): { setClause: string; values: unknown[] } {
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);
    const values = entries.map(([, value]) => value);
    const setters = entries.map(([key], index) => `${this._column(key)} = $${startAt + index}`);
    setters.push(`${this._column('updated_at')} = NOW()`);
    return { setClause: setters.join(', '), values };
  }

  private _buildDeletedCondition(options?: Options): { condition: string; values: unknown[] } {
    if (options?.includeDeleted) return { condition: '', values: [] };
    return {
      condition: options?.onlyDeleted
        ? `${this._column('deleted_at')} IS NOT NULL`
        : `${this._column('deleted_at')} IS NULL`,
      values: []
    };
  }

  private _withAuditOnInsert(record: DbModel, options?: Options): DbModel {
    const actorId = options?.actorId ?? null;
    return {
      ...record,
      created_by_id: (record.created_by_id as string | null | undefined) ?? actorId,
      updated_by_id: (record.updated_by_id as string | null | undefined) ?? actorId,
      deleted_by_id: (record.deleted_by_id as string | null | undefined) ?? null,
      deleted_at: (record.deleted_at as Date | null | undefined) ?? null
    } as DbModel;
  }

  private _withAuditOnUpdate(record: Partial<DbModel>, options?: Options): Partial<DbModel> {
    return {
      ...record,
      updated_by_id: options?.actorId ?? null
    };
  }

  private _buildSelect(options?: Options): string {
    const projection = options?.projection;
    if (!projection) return '*';

    const included = Object.entries(projection)
      .filter(([, value]) => value === 1 || value === true)
      .map(([key]) => this._column(this._toColumnName(key)));

    return included.length > 0 ? included.join(', ') : '*';
  }

  private _table(): string {
    return this.tableName
      .split('.')
      .map((part) => this._column(part))
      .join('.');
  }

  private _column(name: string): string {
    return `"${name.replace(doubleQuoteRegex, '""')}"`;
  }
}
