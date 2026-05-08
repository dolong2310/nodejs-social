import { PermissionListItem } from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import { EHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class UpdatePermissionCommand {
  id: string;
  name?: string;
  description?: string;
  path?: string;
  method?: EHttpMethod;
  module?: string;
  constructor(payload: {
    id: string;
    name?: string;
    description?: string;
    path?: string;
    method?: EHttpMethod;
    module?: string;
  }) {
    this.id = payload.id;
    this.name = payload.name;
    this.description = payload.description;
    this.path = payload.path;
    this.method = payload.method;
    this.module = payload.module;
  }
}

export abstract class UpdatePermissionPort implements UseCase<UpdatePermissionCommand, PermissionListItem> {
  abstract execute(command: UpdatePermissionCommand): Promise<PermissionListItem>;
}
