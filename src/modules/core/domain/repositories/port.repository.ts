export class Paginated<T> {
  readonly count: number;
  readonly limit: number;
  readonly page: number;
  readonly data: readonly T[];

  constructor(props: Paginated<T>) {
    this.count = props.count;
    this.limit = props.limit;
    this.page = props.page;
    this.data = props.data;
  }
}

export type OrderBy = { field: string | true; param: 'asc' | 'desc' };

export type PaginatedQueryParams = {
  limit: number;
  page: number;
  offset: number;
  orderBy: OrderBy;
};

export type Options = {
  projection?: Record<string, unknown>;
};

export interface RepositoryPort<Entity> {
  // Query
  findById(id: string, options?: Options): Promise<Entity | null>;
  findOne(entity: Partial<Entity>, options?: Options): Promise<Entity | null>;
  find(entity: Partial<Entity>, options?: Options): Promise<Entity[]>;
  findAll(options?: Options): Promise<Entity[]>;
  findAllByIds(ids: string[], options?: Options): Promise<Entity[]>;
  findAllPaginated(params: PaginatedQueryParams, options?: Options): Promise<Paginated<Entity>>;

  existsById(id: string, options?: Options): Promise<boolean>;
  count(entity?: Partial<Entity>, options?: Options): Promise<number>;

  // Insert
  insert(entity: Entity, options?: Options): Promise<Entity>;
  insertMany(entities: Entity[], options?: Options): Promise<Entity[]>;

  // Update
  update(id: string, entity: Partial<Entity>, options?: Options): Promise<Entity | null>;
  updateOne(id: string, entity: Partial<Entity>, options?: Options): Promise<void>;
  updateMany(entity: Partial<Entity>, data: Partial<Entity>, options?: Options): Promise<number>;

  // Delete
  deleteById(id: string, options?: Options): Promise<boolean>;
  deleteAllByIds(ids: string[], options?: Options): Promise<boolean>;

  // Transaction
  transaction<T>(handler: () => Promise<T> | T): Promise<T>;
}
