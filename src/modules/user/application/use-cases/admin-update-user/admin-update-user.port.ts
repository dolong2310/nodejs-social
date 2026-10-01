import type { UseCase } from '@/modules/core/application/base.usecase';
import type { EnumUserStatus, UserSafeProps } from '@/modules/user/domain/entities/user.types';

export class AdminUpdateUserInputPort {
  actorId: string;
  userId: string;
  name?: string;
  email?: string;
  password?: string;
  birthday?: Date;
  roleId?: string;
  status?: EnumUserStatus;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;

  constructor(payload: {
    actorId: string;
    userId: string;
    name?: string;
    email?: string;
    password?: string;
    birthday?: Date;
    roleId?: string;
    status?: EnumUserStatus;
    bio?: string;
    location?: string;
    website?: string;
    username?: string;
    avatar?: string;
    coverPhoto?: string;
  }) {
    this.actorId = payload.actorId;
    this.userId = payload.userId;
    this.name = payload.name;
    this.email = payload.email;
    this.password = payload.password;
    this.birthday = payload.birthday;
    this.roleId = payload.roleId;
    this.status = payload.status;
    this.bio = payload.bio;
    this.location = payload.location;
    this.website = payload.website;
    this.username = payload.username;
    this.avatar = payload.avatar;
    this.coverPhoto = payload.coverPhoto;
  }
}

export class AdminUpdateUserOutputPort implements UserSafeProps {
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

export abstract class AdminUpdateUserPort implements UseCase<AdminUpdateUserInputPort, AdminUpdateUserOutputPort> {
  abstract execute(input: AdminUpdateUserInputPort): Promise<AdminUpdateUserOutputPort>;
}
