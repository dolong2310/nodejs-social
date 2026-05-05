import { ROLE_NAME_REGEX } from '@/modules/common/constants/regex.constants';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { CreateRoleProps, ERoleName, RoleProps } from '@/modules/role/domain/entities/role.type';

export class RoleEntity extends Entity<RoleProps> {
  static create(createProps: CreateRoleProps) {
    const id = new UniqueEntityID(generatePrefixId('role'));
    const props: RoleProps = {
      ...createProps,
      description: createProps.description ?? '',
      permissionIds: createProps.permissionIds ?? []
    };
    const role = new RoleEntity({ id, props });
    return role;
  }

  /** `ADMIN` / `USER` do seed tạo — không đổi tên / xóa qua API thường. */
  isSystemRole(): boolean {
    const { name } = this.getProps();
    return name === ERoleName.ADMIN || name === ERoleName.USER;
  }

  validate(): void {
    const { name } = this.getProps();
    invariant(name.trim().length > 0, new ArgumentNotProvidedException('Role name is required'));
    invariant(
      ROLE_NAME_REGEX.test(name),
      new ArgumentInvalidException('Role name must only contain uppercase letters, digits, or underscores')
    );
  }
}
