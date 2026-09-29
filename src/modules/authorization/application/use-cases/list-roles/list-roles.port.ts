import { RoleFullProps } from '@/modules/authorization/domain/entities/role.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class ListRolesInputPort {
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

export class ListRolesOutputPort {
  items: RoleListItem[];
  total: number;
  constructor(payload: { items: RoleListItem[]; total: number }) {
    this.items = payload.items;
    this.total = payload.total;
  }
}

export abstract class ListRolesPort implements UseCase<ListRolesInputPort, ListRolesOutputPort> {
  abstract execute(input: ListRolesInputPort): Promise<ListRolesOutputPort>;
}
