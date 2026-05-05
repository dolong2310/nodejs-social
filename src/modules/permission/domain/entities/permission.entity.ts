import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { CreatePermissionProps, PermissionProps } from '@/modules/permission/domain/entities/permission.type';
import { validatePath } from '@/modules/permission/domain/helpers/validate-path';

export class PermissionEntity extends Entity<PermissionProps> {
  static create(createProps: CreatePermissionProps) {
    const id = new UniqueEntityID(generatePrefixId('permission'));
    const props: PermissionProps = {
      ...createProps
    };
    const permission = new PermissionEntity({ id, props });
    return permission;
  }

  validate(): void {
    const { name, path, method, module } = this.getProps();
    invariant(name.trim().length > 0, new ArgumentNotProvidedException('Permission name is required'));
    invariant(path.trim().length > 0, new ArgumentNotProvidedException('Permission path is required'));
    invariant(validatePath(path, { allowParams: true }), new ArgumentInvalidException('Permission path is invalid'));
    invariant(method.trim().length > 0, new ArgumentNotProvidedException('Permission method is required'));
    invariant(module.trim().length > 0, new ArgumentNotProvidedException('Permission module is required'));
  }
}
