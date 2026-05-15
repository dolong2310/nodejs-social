import {
  CreatePermissionProps,
  PermissionFullProps,
  PermissionProps
} from '@/modules/authorization/domain/entities/permission.type';
import { PermissionPath } from '@/modules/authorization/domain/value-objects/permission-path.value-object';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';

export class PermissionEntity extends Entity<PermissionProps, PermissionFullProps> {
  static create(createProps: CreatePermissionProps) {
    const id = new UniqueEntityID(generatePrefixId('permission'));
    const props: PermissionProps = {
      ...createProps,
      path: PermissionPath.create(createProps.path)
    };
    const permission = new PermissionEntity({ id, props });
    return permission;
  }

  validate(): void {
    const { name, path, method, module } = this.getProps();
    invariant(name.trim().length > 0, new ArgumentNotProvidedException('Permission name is required'));
    invariant(path instanceof PermissionPath, new ArgumentInvalidException('Permission path must be a PermissionPath'));
    invariant(method.trim().length > 0, new ArgumentNotProvidedException('Permission method is required'));
    invariant(module.trim().length > 0, new ArgumentNotProvidedException('Permission module is required'));
  }
}
