import { UseCase } from '@/modules/core/application/base.usecase';
import { EnumUserStatus, UserSafeProps } from '@/modules/user/domain/entities/user.type';

export class AdminCreateUserCommand {
  actorId: string;
  name: string;
  email: string;
  password: string;
  birthday: Date;
  roleId: string;
  status?: EnumUserStatus;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;

  constructor(payload: {
    actorId: string;
    name: string;
    email: string;
    password: string;
    birthday: Date;
    roleId: string;
    status?: EnumUserStatus;
    bio?: string;
    location?: string;
    website?: string;
    username?: string;
    avatar?: string;
    coverPhoto?: string;
  }) {
    this.actorId = payload.actorId;
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

export class AdminCreateUserResult implements UserSafeProps {
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

export abstract class AdminCreateUserPort implements UseCase<AdminCreateUserCommand, AdminCreateUserResult> {
  abstract execute(command: AdminCreateUserCommand): Promise<AdminCreateUserResult>;
}
