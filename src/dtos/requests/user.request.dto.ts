import { ParamsDictionary } from 'express-serve-static-core';

export interface UpdateMeBodyDTO {
  name?: string;
  dateOfBirth?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
}

export class UpdateMeRequestDTO {
  name?: string;
  dateOfBirth?: Date;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;

  constructor(body: UpdateMeBodyDTO) {
    if (body.name !== undefined) this.name = body.name.trim();
    if (body.dateOfBirth !== undefined) this.dateOfBirth = new Date(body.dateOfBirth);
    if (body.bio !== undefined) this.bio = body.bio.trim();
    if (body.location !== undefined) this.location = body.location.trim();
    if (body.website !== undefined) this.website = body.website.trim();
    if (body.username !== undefined) this.username = body.username.trim();
    if (body.avatar !== undefined) this.avatar = body.avatar;
    if (body.coverPhoto !== undefined) this.coverPhoto = body.coverPhoto;
  }
}

export interface GetUserProfileParamsDTO extends ParamsDictionary {
  username: string;
}
