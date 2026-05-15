import {
  CreateRoleProps,
  EnumRoleName,
  RoleFullProps,
  RoleProps
} from '@/modules/authorization/domain/entities/role.type';
import { RoleName } from '@/modules/authorization/domain/value-objects/role-name.value-object';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';

export class RoleEntity extends Entity<RoleProps, RoleFullProps> {
  static create(createProps: CreateRoleProps) {
    const id = new UniqueEntityID(generatePrefixId('role'));
    const props: RoleProps = {
      ...createProps,
      name: RoleName.create(createProps.name),
      description: createProps.description ?? '',
      permissionIds: createProps.permissionIds ?? []
    };
    const role = new RoleEntity({ id, props });
    return role;
  }

  /** `ADMIN` / `USER` do seed tạo — không đổi tên / xóa qua API thường. */
  isSystemRole(): boolean {
    const { name } = this.getProps();
    return name.value === EnumRoleName.ADMIN || name.value === EnumRoleName.USER;
  }

  validate(): void {
    const { name, description, isActive, permissionIds } = this.getProps();
    invariant(name instanceof RoleName, new ArgumentInvalidException('Role name must be a RoleName'));
    invariant(typeof description === 'string', new ArgumentInvalidException('Role description must be a string'));
    invariant(typeof isActive === 'boolean', new ArgumentInvalidException('Role active status must be a boolean'));
    invariant(Array.isArray(permissionIds), new ArgumentInvalidException('Role permission IDs must be an array'));
    invariant(
      permissionIds.every((permissionId) => typeof permissionId === 'string' && permissionId.trim().length > 0),
      new ArgumentInvalidException('Role permission IDs must be non-empty strings')
    );
  }
}
