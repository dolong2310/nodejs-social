import { PermissionListItem } from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import { CreatePermissionProps, EHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import { UseCase } from '@/modules/core/application/base.usecase';

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

export abstract class CreatePermissionPort implements UseCase<CreatePermissionCommand, PermissionListItem> {
  abstract execute(command: CreatePermissionCommand): Promise<PermissionListItem>;
}
