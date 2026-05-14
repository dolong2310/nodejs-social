import { CreatePermissionProps, EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import type { Prettify } from 'ts-essentials';

export interface ListPermissionsInput {
  limit: number;
  skip?: number;
}

/** Trùng cặp `path` + `method` = một permission. `excludeId` khi cập nhật (bỏ qua bản ghi hiện tại). */
export interface FindPermissionByPathAndMethodInput {
  path: string;
  method: EnumHttpMethod;
  excludeId?: string;
}

export interface CreatePermissionInput extends CreatePermissionProps {}

export type UpdatePermissionInput = Prettify<Partial<CreatePermissionInput>>;
