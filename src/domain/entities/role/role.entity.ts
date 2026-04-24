import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { CreateRoleProps, RoleProps } from '@/domain/entities/role/role.type';

export class RoleEntity extends Entity<RoleProps> {
  static create(createProps: CreateRoleProps) {
    const id = new UniqueEntityID();
    const props: RoleProps = {
      ...createProps,
      description: createProps.description ?? '',
      permissionIds: createProps.permissionIds ?? []
    };
    const role = new RoleEntity({ id, props });
    return role;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
