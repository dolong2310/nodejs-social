import { CreatePermissionProps, EHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import type { Prettify } from 'ts-essentials';

export interface IListPermissionsInput {
  limit: number;
  skip?: number;
}

/** Trùng cặp `path` + `method` = một permission. `excludeId` khi cập nhật (bỏ qua bản ghi hiện tại). */
export interface IFindPermissionByPathAndMethodInput {
  path: string;
  method: EHttpMethod;
  excludeId?: string;
}

export interface ICreatePermissionInput extends CreatePermissionProps {}

export type IUpdatePermissionInput = Prettify<Partial<ICreatePermissionInput>>;
