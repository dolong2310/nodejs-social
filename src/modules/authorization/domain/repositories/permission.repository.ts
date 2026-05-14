import { PermissionEntity } from '@/modules/authorization/domain/entities/permission.entity';
import {
  CreatePermissionInput,
  FindPermissionByPathAndMethodInput,
  ListPermissionsInput,
  UpdatePermissionInput
} from '@/modules/authorization/domain/repositories/permission.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface PermissionRepositoryPort extends RepositoryPort<PermissionEntity> {
  findPermissions(data: ListPermissionsInput): Promise<PermissionEntity[]>;
  countPermissions(): Promise<number>;
  findPermissionById(id: string): Promise<PermissionEntity | null>;
  findPermissionByPathAndMethod(data: FindPermissionByPathAndMethodInput): Promise<PermissionEntity | null>;
  createPermissions(data: CreatePermissionInput[]): Promise<PermissionEntity[]>;
  createPermission(data: CreatePermissionInput): Promise<PermissionEntity | null>;
  updatePermission(id: string, data: UpdatePermissionInput): Promise<PermissionEntity | null>;
  deletePermission(id: string): Promise<PermissionEntity | null>;
  deletePermissions(ids: string[]): Promise<number>;
}
