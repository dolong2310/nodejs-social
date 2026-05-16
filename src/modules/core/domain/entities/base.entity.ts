import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import {
  ArgumentInvalidException,
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException
} from '@/modules/core/domain/exceptions/exceptions';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { convertPropsToObject } from '@/modules/core/domain/helpers/object';
import { isEmpty } from 'lodash-es';
import type { MarkOptional, Prettify } from 'ts-essentials';

export interface BaseEntityProps {
  id: UniqueEntityID;
  createdAt: Date;
  createdById?: string | null;
  updatedAt: Date;
  updatedById?: string | null;
  deletedAt?: Date | null;
  deletedById?: string | null;
}

export interface CreateEntityProps<T> extends MarkOptional<
  BaseEntityProps,
  'createdAt' | 'createdById' | 'updatedAt' | 'updatedById' | 'deletedAt' | 'deletedById'
> {
  props: T;
}

export abstract class Entity<
  Props,
  ObjectProps extends object = Prettify<Props & Omit<BaseEntityProps, 'id'> & { id: string }>
> {
  private _id: UniqueEntityID;
  private readonly _createdAt: Date;
  private readonly _createdById: string | null;
  private _updatedAt: Date;
  private _updatedById: string | null;
  private _deletedAt: Date | null;
  private _deletedById: string | null;
  private readonly _props: Props;

  constructor({
    id,
    props,
    createdAt,
    createdById = null,
    updatedAt,
    updatedById = null,
    deletedAt = null,
    deletedById = null
  }: CreateEntityProps<Props>) {
    this._id = id;
    this._validateProps(props);
    const now = new Date();
    this._createdAt = createdAt || now;
    this._createdById = createdById;
    this._updatedAt = updatedAt || now;
    this._updatedById = updatedById;
    this._deletedAt = deletedAt;
    this._deletedById = deletedById;
    this._props = props;
    this.validate();
  }

  static isEntity(entity: unknown): entity is Entity<unknown> {
    return entity instanceof Entity;
  }

  get id(): UniqueEntityID {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get createdById(): string | null {
    return this._createdById;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  set updatedAt(value: Date) {
    invariant(
      value >= this._createdAt,
      new ArgumentOutOfRangeException('Updated at must be greater than or equal to created at')
    );
    this._updatedAt = value;
  }

  get updatedById(): string | null {
    return this._updatedById;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  get deletedById(): string | null {
    return this._deletedById;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  markDeleted(actorId: string | null = null, deletedAt = new Date()): void {
    invariant(deletedAt >= this._createdAt, new ArgumentOutOfRangeException('Deleted at must be after created at'));
    this._deletedAt = deletedAt;
    this._deletedById = actorId;
    this._updatedAt = deletedAt;
    this._updatedById = actorId;
  }

  getProps(): Readonly<Props & BaseEntityProps> {
    const clone = {
      id: this.id,
      createdAt: this._createdAt,
      createdById: this._createdById,
      updatedAt: this._updatedAt,
      updatedById: this._updatedById,
      deletedAt: this._deletedAt,
      deletedById: this._deletedById,
      ...this._props
    };
    return Object.freeze(clone);
  }

  /**
   * Convert an Entity and all sub-entities/Value Objects it
   * contains to a plain object with primitive types. Can be
   * useful when logging an entity during testing/debugging
   */
  toObject<T extends ObjectProps = ObjectProps>(): Readonly<T> {
    const clone = convertPropsToObject(this.getProps());
    const result: Record<string, unknown> = {
      ...clone,
      id: this.id.toString(),
      createdAt: this._createdAt,
      createdById: this._createdById,
      updatedAt: this._updatedAt,
      updatedById: this._updatedById,
      deletedAt: this._deletedAt,
      deletedById: this._deletedById
    };
    return Object.freeze(result) as Readonly<T>;
  }
  /**
   * Each entity must have some validate/business rules
   * This method is called every time before save this entity to the database
   */
  abstract validate(): void;

  private _validateProps(props: Props) {
    const MAX_PROPS = 32;
    invariant(!isEmpty(props), new ArgumentNotProvidedException('Entity props should not be empty'));
    invariant(typeof props === 'object', new ArgumentInvalidException('Entity props should be an object'));
    invariant(
      Object.keys(props as Record<string, unknown>).length <= MAX_PROPS,
      new ArgumentOutOfRangeException(`The entity props count must smaller than ${MAX_PROPS} properties`)
    );
  }
}
