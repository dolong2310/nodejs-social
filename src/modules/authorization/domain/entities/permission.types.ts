import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { PermissionPath } from '@/modules/authorization/domain/value-objects/permission-path.value-object';
import type { Prettify } from 'ts-essentials';

export interface PermissionProps {
  name: string;
  description: string;
  path: PermissionPath;
  method: EnumHttpMethod;
  module: string;
}

export interface PermissionPrimitiveProps extends Omit<PermissionProps, 'path'> {
  path: string;
}

export interface PermissionFullProps extends Prettify<
  PermissionPrimitiveProps & Omit<BaseEntityProps, 'id'> & { id: string }
> {}

export interface CreatePermissionProps extends PermissionPrimitiveProps {}

export enum EnumHttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD'
}
