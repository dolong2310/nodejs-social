import { generatePrefixId, isValidId } from '@/modules/core/domain/helpers/ids';

type EntityId = string | number;

export class UniqueEntityID {
  protected readonly id: EntityId;

  constructor(id?: EntityId) {
    this.id = id || generatePrefixId('id');
  }

  isValidId(): boolean {
    return isValidId(this.id.toString());
  }

  equals(id?: UniqueEntityID): boolean {
    if (!id) {
      return false;
    }
    if (!(id instanceof this.constructor)) {
      return false;
    }
    return id.toValue() === this.id;
  }

  toString() {
    return String(this.id);
  }

  toValue(): EntityId {
    return this.id;
  }
}
