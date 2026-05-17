import { UseCase } from '@/modules/core/application/base.usecase';
import { EnumUserStatus, UserSafeProps } from '@/modules/user/domain/entities/user.type';

export class AdminListUsersQuery {
  page: number;
  limit: number;

  constructor(payload: { page: number; limit: number }) {
    this.page = payload.page;
    this.limit = payload.limit;
  }
}

export class AdminListUsersItem implements UserSafeProps {
  id: string;
  name: string;
  email: string;
  birthday: Date;
  roleId: string;
  status: EnumUserStatus;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(payload: UserSafeProps) {
    this.id = payload.id;
    this.name = payload.name;
    this.email = payload.email;
    this.birthday = payload.birthday;
    this.roleId = payload.roleId;
    this.status = payload.status;
    this.bio = payload.bio;
    this.location = payload.location;
    this.website = payload.website;
    this.username = payload.username;
    this.avatar = payload.avatar;
    this.coverPhoto = payload.coverPhoto;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export class AdminListUsersResult {
  items: AdminListUsersItem[];
  total: number;

  constructor(payload: { items: UserSafeProps[]; total: number }) {
    this.items = payload.items.map((item) => new AdminListUsersItem(item));
    this.total = payload.total;
  }
}

export abstract class AdminListUsersPort implements UseCase<AdminListUsersQuery, AdminListUsersResult> {
  abstract execute(query: AdminListUsersQuery): Promise<AdminListUsersResult>;
}
