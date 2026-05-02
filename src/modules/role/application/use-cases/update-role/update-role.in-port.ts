import { UseCase } from '@/modules/core/application/base.usecase';
import { RoleListItem } from '@/modules/role/application/use-cases/list-roles/list-roles.in-port';
import { CreateRoleProps } from '@/modules/role/domain/entities/role.type';
import { MarkOptional } from 'ts-essentials';

export class UpdateRoleCommand implements MarkOptional<CreateRoleProps, 'name' | 'isActive'> {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
  constructor(payload: {
    id: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: string[];
  }) {
    this.id = payload.id;
    this.name = payload.name;
    this.description = payload.description;
    this.isActive = payload.isActive;
    this.permissionIds = payload.permissionIds;
  }
}

export abstract class UpdateRoleInPort implements UseCase<UpdateRoleCommand, RoleListItem> {
  abstract execute(command: UpdateRoleCommand): Promise<RoleListItem>;
}
