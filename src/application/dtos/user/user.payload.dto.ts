import { UserIdPayloadDTO } from '@/application/dtos/common/common.payload.dto';

export class FindUserByEmailPayloadDTO {
  email: string;
  constructor(payload: { email: string }) {
    this.email = payload.email;
  }
}

export class FindUserByIdPayloadDTO extends UserIdPayloadDTO {}

export class FindUserByUsernamePayloadDTO {
  username: string;
  constructor(payload: { username: string }) {
    this.username = payload.username;
  }
}

export class GetMePayloadDTO extends UserIdPayloadDTO {}

export class UpdateMePayloadDTO {
  userId: string;
  name?: string;
  dateOfBirth?: Date;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
  constructor(payload: {
    userId: string;
    name?: string;
    dateOfBirth?: string;
    bio?: string;
    location?: string;
    website?: string;
    username?: string;
    avatar?: string;
    coverPhoto?: string;
  }) {
    this.userId = payload.userId;
    if (payload.name !== undefined) this.name = payload.name.trim();
    if (payload.dateOfBirth !== undefined) this.dateOfBirth = new Date(payload.dateOfBirth);
    if (payload.bio !== undefined) this.bio = payload.bio.trim();
    if (payload.location !== undefined) this.location = payload.location.trim();
    if (payload.website !== undefined) this.website = payload.website.trim();
    if (payload.username !== undefined) this.username = payload.username.trim();
    if (payload.avatar !== undefined) this.avatar = payload.avatar;
    if (payload.coverPhoto !== undefined) this.coverPhoto = payload.coverPhoto;
  }
}

export class GetUserProfilePayloadDTO {
  userId: string;
  username: string;
  constructor(payload: { userId: string; username: string }) {
    this.userId = payload.userId;
    this.username = payload.username;
  }
}

export class InvalidateUserCachePayloadDTO {
  userId: string;
  usernames: string[];
  constructor(payload: { userId: string; usernames: string[] }) {
    this.userId = payload.userId;
    this.usernames = payload.usernames ?? [];
  }
}
