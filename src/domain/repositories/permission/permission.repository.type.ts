import { CreatePermissionProps } from '@/domain/entities/permission/permission.type';

export interface IListPermissionsInput {
  limit: number;
  skip?: number;
}

export interface ICreatePermissionInput extends CreatePermissionProps {}

export interface IUpdatePermissionInput extends CreatePermissionProps {}
