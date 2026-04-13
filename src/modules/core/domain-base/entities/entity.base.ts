import { UniqueEntityID } from '@/modules/core/domain-base/entities/unique-entity';
import {
  ArgumentInvalidException,
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException
} from '@/modules/core/exceptions/exceptions';
import { invariant } from '@/modules/core/helpers/invariant';
import { convertPropsToObject } from '@/modules/core/helpers/object';
import { isEmpty } from 'lodash-es';
import type { MarkOptional } from 'ts-essentials';

export interface BaseEntityProps {
  id: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntityProps<T> extends MarkOptional<BaseEntityProps, 'createdAt' | 'updatedAt'> {
  props: T;
}

export abstract class Entity<Props> {
  private _id: UniqueEntityID;
  private readonly _createdAt: Date;
  private readonly _props: Props;
  private _updatedAt: Date;

  constructor({ id, props, createdAt, updatedAt }: CreateEntityProps<Props>) {
    this._id = id;
    this._validateProps(props);
    const now = new Date();
    this._createdAt = createdAt || now;
    this._updatedAt = updatedAt || now;
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

  get updatedAt(): Date {
    return this._updatedAt;
  }

  getProps(): Props & BaseEntityProps {
    const clone = {
      id: this.id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ...this._props
    };
    return Object.freeze(clone);
  }

  /**
   * Convert an Entity and all sub-entities/Value Objects it
   * contains to a plain object with primitive types. Can be
   * useful when logging an entity during testing/debugging
   */
  toObject() {
    const clone = convertPropsToObject(this.getProps());
    const result = {
      id: this.id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ...clone
    };
    return Object.freeze(result);
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
