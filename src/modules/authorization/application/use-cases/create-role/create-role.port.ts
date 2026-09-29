import { RoleListItem } from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import { CreateRoleProps } from '@/modules/authorization/domain/entities/role.type';
import { UseCase } from '@/modules/core/application/base.usecase';
import { MarkOptional } from 'ts-essentials';

export class CreateRoleInputPort implements MarkOptional<CreateRoleProps, 'isActive'> {
  name: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
  constructor(payload: CreateRoleProps) {
    this.name = payload.name;
    this.description = payload.description;
    this.isActive = payload.isActive;
    this.permissionIds = payload.permissionIds;
  }
}

export abstract class CreateRolePort implements UseCase<CreateRoleInputPort, RoleListItem> {
  abstract execute(input: CreateRoleInputPort): Promise<RoleListItem>;
}
