import { UseCase } from '@/modules/core/application/base.usecase';
import { PermissionListItem } from '@/modules/permission/application/use-cases/list-permissions/list-permissions.in-port';
import { EHttpMethod } from '@/modules/permission/domain/entities/permission.type';

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

export abstract class UpdatePermissionInPort implements UseCase<UpdatePermissionCommand, PermissionListItem> {
  abstract execute(command: UpdatePermissionCommand): Promise<PermissionListItem>;
}
