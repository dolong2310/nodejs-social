import { CreateRoleProps } from '@/modules/authorization/domain/entities/role.type';
import { ParamsDictionary } from 'express-serve-static-core';
import { MarkOptional } from 'ts-essentials';

export class CreateRoleBodyDTO implements CreateRoleProps {
  name: string;
  description?: string;
  isActive: boolean;
  permissionIds?: string[];

  constructor(body: { name: string; description?: string; isActive: boolean; permissionIds?: string[] }) {
    this.name = body.name;
    this.description = body.description;
    this.isActive = body.isActive;
    this.permissionIds = body.permissionIds;
  }
}

export class UpdateRoleBodyDTO implements MarkOptional<CreateRoleProps, 'name' | 'isActive'> {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];

  constructor(body: { name?: string; description?: string; isActive?: boolean; permissionIds?: string[] }) {
    this.name = body.name;
    this.description = body.description;
    this.isActive = body.isActive;
    this.permissionIds = body.permissionIds;
  }
}

export interface RoleIdParamsDTO extends ParamsDictionary {
  roleId: string;
}
