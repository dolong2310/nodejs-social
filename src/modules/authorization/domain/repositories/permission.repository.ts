import { PermissionEntity } from '@/modules/authorization/domain/entities/permission.entity';
import {
  ICreatePermissionInput,
  IFindPermissionByPathAndMethodInput,
  IListPermissionsInput,
  IUpdatePermissionInput
} from '@/modules/authorization/domain/repositories/permission.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface PermissionRepositoryPort extends RepositoryPort<PermissionEntity> {
  findPermissions(data: IListPermissionsInput): Promise<PermissionEntity[]>;
  countPermissions(): Promise<number>;
  findPermissionById(id: string): Promise<PermissionEntity | null>;
  findPermissionByPathAndMethod(data: IFindPermissionByPathAndMethodInput): Promise<PermissionEntity | null>;
  createPermissions(data: ICreatePermissionInput[]): Promise<PermissionEntity[]>;
  createPermission(data: ICreatePermissionInput): Promise<PermissionEntity | null>;
  updatePermission(id: string, data: IUpdatePermissionInput): Promise<PermissionEntity | null>;
  deletePermission(id: string): Promise<PermissionEntity | null>;
  deletePermissions(ids: string[]): Promise<number>;
}
