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

export interface RepositoryPort<Entity> {
  findById(id: string): Promise<Entity>;
  // import type { StringEnum } from '@/modules/core/types/general.type';
  // findByKey<Key extends StringEnum<keyof Entity>>(key: Key, value: Entity[Key]): Promise<Entity>;
  findByKey<Key extends keyof Entity & string>(key: Key, value: Entity[Key]): Promise<Entity>;
  findAll(): Promise<Entity[]>;
  findAllByIds(ids: string[]): Promise<Entity[]>;
  findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<Entity>>;
  existsById(id: string): Promise<boolean>;
  count(): Promise<bigint | number>;

  insert(entity: Entity): Promise<void> | Promise<Entity>;
  insertBulk(entity: Entity): Promise<void> | Promise<Entity>;
  insertMany(entities: Entity[]): Promise<void> | Promise<Entity[]>;
  insertBulkMany(entities: Entity[]): Promise<void> | Promise<Entity[]>;

  update(entity: Entity): Promise<void> | Promise<Entity>;
  updateBulk(entity: Entity): Promise<void> | Promise<Entity>;
  updateMany(entities: Entity[]): Promise<void> | Promise<Entity[]>;
  updateBulkMany(entities: Entity[]): Promise<void> | Promise<Entity[]>;

  delete(entity: Entity): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;
  deleteAllByIds(ids: string[]): Promise<boolean>;
  deleteBulk(entity: Entity): Promise<boolean>;

  transaction<T>(handler: () => Promise<T> | T): Promise<T>;
}
