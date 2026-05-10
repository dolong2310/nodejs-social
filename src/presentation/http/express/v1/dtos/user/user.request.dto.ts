import { ParamsDictionary } from 'express-serve-static-core';
import { normalizeUsername } from '@/modules/user/domain/helpers/user-normalization.helper';

export interface UpdateMeRequestBody {
  name?: string;
  birthday?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
}

export class UpdateMeRequestDTO {
  name?: string;
  birthday?: Date;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;

  constructor(body: UpdateMeRequestBody) {
    if (body.name !== undefined) this.name = body.name.trim();
    if (body.birthday !== undefined) this.birthday = new Date(body.birthday);
    if (body.bio !== undefined) this.bio = body.bio.trim();
    if (body.location !== undefined) this.location = body.location.trim();
    if (body.website !== undefined) this.website = body.website.trim();
    if (body.username !== undefined) this.username = normalizeUsername(body.username);
    if (body.avatar !== undefined) this.avatar = body.avatar;
    if (body.coverPhoto !== undefined) this.coverPhoto = body.coverPhoto;
  }
}

export interface GetUserProfileParamsDTO extends ParamsDictionary {
  username: string;
}

export class ChangePasswordRequestDTO {
  password: string;
  confirmPassword: string;

  constructor(body: { password: string; confirmPassword: string }) {
    this.password = body.password;
    this.confirmPassword = body.confirmPassword;
  }
}
