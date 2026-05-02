import { UseCase } from '@/modules/core/application/base.usecase';
import { EUserStatus, UserSafeProps } from '@/modules/user/domain/entities/user.type';

export class GetUserProfileQuery {
  userId: string;
  username: string;
  constructor(payload: { userId: string; username: string }) {
    this.userId = payload.userId;
    this.username = payload.username;
  }
}

export class GetUserProfileResult implements UserSafeProps {
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

export abstract class GetUserProfileInPort implements UseCase<GetUserProfileQuery, GetUserProfileResult> {
  abstract execute(query: GetUserProfileQuery): Promise<GetUserProfileResult>;
}
