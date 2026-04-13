import { generatePrefixId } from '@/modules/core/helpers/ids';
import type { EntityId } from '@/modules/core/types/general.type';

export class UniqueEntityID {
  protected readonly id: EntityId;

  constructor(id?: EntityId) {
    this.id = id || generatePrefixId('entity');
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
