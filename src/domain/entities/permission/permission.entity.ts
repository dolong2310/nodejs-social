import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { CreatePermissionProps, PermissionProps } from '@/domain/entities/permission/permission.type';

export class PermissionEntity extends Entity<PermissionProps> {
  static create(createProps: CreatePermissionProps) {
    const id = new UniqueEntityID();
    const props: PermissionProps = {
      ...createProps
    };
    const permission = new PermissionEntity({ id, props });
    return permission;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
