import { UseCase } from '@/modules/core/application/base.usecase';
import { EnumUserStatus, UserSafeProps } from '@/modules/user/domain/entities/user.type';

export class AdminGetUserQuery {
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}

export class AdminGetUserResult implements UserSafeProps {
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

export abstract class AdminGetUserPort implements UseCase<AdminGetUserQuery, AdminGetUserResult> {
  abstract execute(query: AdminGetUserQuery): Promise<AdminGetUserResult>;
}
