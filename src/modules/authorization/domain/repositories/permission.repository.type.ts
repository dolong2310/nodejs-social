import { CreatePermissionProps, EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import type { Prettify } from 'ts-essentials';

export interface ListPermissionsInput {
  limit: number;
  skip?: number;
}

/** Duplicate `path` + `method` means the same permission. `excludeId` skips the current record during updates. */
export interface FindPermissionByPathAndMethodInput {
  path: string;
  method: EnumHttpMethod;
  excludeId?: string;
}

export interface CreatePermissionInput extends CreatePermissionProps {}

export type UpdatePermissionInput = Prettify<Partial<CreatePermissionInput>>;
