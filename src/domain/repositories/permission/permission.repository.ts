import { PermissionEntity } from '@/domain/entities/permission/permission.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  ICreatePermissionInput,
  IListPermissionsInput,
  IUpdatePermissionInput
} from '@/domain/repositories/permission/permission.repository.type';

export interface PermissionRepositoryPort extends RepositoryPort<PermissionEntity> {
  findPermissions(data: IListPermissionsInput): Promise<PermissionEntity[]>;
  findPermissionById(id: string): Promise<PermissionEntity | null>;
  createPermissions(data: ICreatePermissionInput[]): Promise<PermissionEntity[]>;
  createPermission(data: ICreatePermissionInput): Promise<PermissionEntity | null>;
  updatePermission(id: string, data: IUpdatePermissionInput): Promise<PermissionEntity | null>;
  deletePermission(id: string): Promise<PermissionEntity | null>;
  deletePermissions(ids: string[]): Promise<number>;
}
