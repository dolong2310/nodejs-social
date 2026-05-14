import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import type { Prettify } from 'ts-essentials';

export interface PermissionProps {
  name: string;
  description: string;
  path: string;
  method: EnumHttpMethod;
  module: string;
}

export interface PermissionFullProps extends Prettify<PermissionProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreatePermissionProps extends PermissionProps {}

export enum EnumHttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD'
}
