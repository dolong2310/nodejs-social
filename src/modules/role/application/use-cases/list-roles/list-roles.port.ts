import { UseCase } from '@/modules/core/application/base.usecase';
import { RoleFullProps } from '@/modules/role/domain/entities/role.type';

export class ListRolesQuery {
  page: number;
  limit: number;
  constructor(payload: { page: number; limit: number }) {
    this.page = payload.page;
    this.limit = payload.limit;
  }
}

export class RoleListItem implements RoleFullProps {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: string[];
  createdAt: Date;
  updatedAt: Date;
  constructor(payload: RoleFullProps) {
    this.id = payload.id;
    this.name = payload.name;
    this.description = payload.description;
    this.isActive = payload.isActive;
    this.permissionIds = payload.permissionIds;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export class ListRolesResult {
  items: RoleListItem[];
  total: number;
  constructor(payload: { items: RoleListItem[]; total: number }) {
    this.items = payload.items;
    this.total = payload.total;
  }
}

export abstract class ListRolesPort implements UseCase<ListRolesQuery, ListRolesResult> {
  abstract execute(query: ListRolesQuery): Promise<ListRolesResult>;
}
