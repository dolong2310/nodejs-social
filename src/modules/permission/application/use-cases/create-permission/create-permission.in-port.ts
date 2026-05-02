import { UseCase } from '@/modules/core/application/base.usecase';
import { PermissionListItem } from '@/modules/permission/application/use-cases/list-permissions/list-permissions.in-port';
import { CreatePermissionProps, EHttpMethod } from '@/modules/permission/domain/entities/permission.type';

export class CreatePermissionCommand implements CreatePermissionProps {
  name: string;
  description: string;
  path: string;
  method: EHttpMethod;
  module: string;
  constructor(payload: CreatePermissionProps) {
    this.name = payload.name;
    this.description = payload.description;
    this.path = payload.path;
    this.method = payload.method;
    this.module = payload.module;
  }
}

export abstract class CreatePermissionInPort implements UseCase<CreatePermissionCommand, PermissionListItem> {
  abstract execute(command: CreatePermissionCommand): Promise<PermissionListItem>;
}
