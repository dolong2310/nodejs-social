import type { RoleListItem } from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import type { CreateRoleProps } from '@/modules/authorization/domain/entities/role.types';
import type { UseCase } from '@/modules/core/application/base.usecase';
import type { MarkOptional } from 'ts-essentials';

export class UpdateRoleInputPort implements MarkOptional<CreateRoleProps, 'name' | 'isActive'> {
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

export abstract class UpdateRolePort implements UseCase<UpdateRoleInputPort, RoleListItem> {
  abstract execute(input: UpdateRoleInputPort): Promise<RoleListItem>;
}
