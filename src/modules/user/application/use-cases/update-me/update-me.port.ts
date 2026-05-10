import { UseCase } from '@/modules/core/application/base.usecase';
import { EUserStatus, UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { normalizeUsername } from '@/modules/user/domain/helpers/user-normalization.helper';

export class UpdateMeCommand {
  userId: string;
  name?: string;
  birthday?: Date;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
  constructor(payload: {
    userId: string;
    name?: string;
    birthday?: string;
    bio?: string;
    location?: string;
    website?: string;
    username?: string;
    avatar?: string;
    coverPhoto?: string;
  }) {
    this.userId = payload.userId;
    if (payload.name !== undefined) this.name = payload.name.trim();
    if (payload.birthday !== undefined) this.birthday = new Date(payload.birthday);
    if (payload.bio !== undefined) this.bio = payload.bio.trim();
    if (payload.location !== undefined) this.location = payload.location.trim();
    if (payload.website !== undefined) this.website = payload.website.trim();
    if (payload.username !== undefined) this.username = normalizeUsername(payload.username);
    if (payload.avatar !== undefined) this.avatar = payload.avatar;
    if (payload.coverPhoto !== undefined) this.coverPhoto = payload.coverPhoto;
  }
}

export class UpdateMeResult implements UserSafeProps {
  id: string;
  name: string;
  email: string;
  birthday: Date;
  roleId: string;
  status: EUserStatus;
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

export abstract class UpdateMePort implements UseCase<UpdateMeCommand, UpdateMeResult> {
  abstract execute(command: UpdateMeCommand): Promise<UpdateMeResult>;
}
