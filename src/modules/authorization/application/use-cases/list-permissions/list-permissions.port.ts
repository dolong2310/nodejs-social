import { EnumHttpMethod, PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class ListPermissionsQuery {
  page: number;
  limit: number;
  constructor(payload: { page: number; limit: number }) {
    this.page = payload.page;
    this.limit = payload.limit;
  }
}

export class PermissionListItem implements PermissionFullProps {
  id: string;
  name: string;
  description: string;
  path: string;
  method: EnumHttpMethod;
  module: string;
  createdAt: Date;
  updatedAt: Date;
  constructor(payload: PermissionFullProps) {
    this.id = payload.id;
    this.name = payload.name;
    this.description = payload.description;
    this.path = payload.path;
    this.method = payload.method;
    this.module = payload.module;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export class ListPermissionsResult {
  items: PermissionListItem[];
  total: number;
  constructor(payload: { items: PermissionListItem[]; total: number }) {
    this.items = payload.items;
    this.total = payload.total;
  }
}

export abstract class ListPermissionsPort implements UseCase<ListPermissionsQuery, ListPermissionsResult> {
  abstract execute(query: ListPermissionsQuery): Promise<ListPermissionsResult>;
}
