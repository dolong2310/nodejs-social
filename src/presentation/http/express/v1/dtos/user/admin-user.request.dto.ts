import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { Username } from '@/modules/common/domain/value-objects/username.value-object';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.type';
import { ParamsDictionary } from 'express-serve-static-core';

export interface AdminUserIdParamsDTO extends ParamsDictionary {
  userId: string;
}

export interface AdminCreateUserRequestBody {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthday: string;
  roleId: string;
  status?: EnumUserStatus;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
}

export class AdminCreateUserRequestDTO {
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

  constructor(body: AdminCreateUserRequestBody) {
    this.name = body.name.trim();
    this.email = EmailAddress.normalize(body.email);
    this.password = body.password;
    this.birthday = new Date(body.birthday);
    this.roleId = body.roleId;
    this.status = body.status;
    if (body.bio !== undefined) this.bio = body.bio.trim();
    if (body.location !== undefined) this.location = body.location.trim();
    if (body.website !== undefined) this.website = body.website.trim();
    if (body.username !== undefined) this.username = Username.normalize(body.username);
    if (body.avatar !== undefined) this.avatar = body.avatar;
    if (body.coverPhoto !== undefined) this.coverPhoto = body.coverPhoto;
  }
}

export interface AdminUpdateUserRequestBody extends Partial<AdminCreateUserRequestBody> {}

export class AdminUpdateUserRequestDTO {
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

  constructor(body: AdminUpdateUserRequestBody) {
    if (body.name !== undefined) this.name = body.name.trim();
    if (body.email !== undefined) this.email = EmailAddress.normalize(body.email);
    if (body.password !== undefined) this.password = body.password;
    if (body.birthday !== undefined) this.birthday = new Date(body.birthday);
    if (body.roleId !== undefined) this.roleId = body.roleId;
    if (body.status !== undefined) this.status = body.status;
    if (body.bio !== undefined) this.bio = body.bio.trim();
    if (body.location !== undefined) this.location = body.location.trim();
    if (body.website !== undefined) this.website = body.website.trim();
    if (body.username !== undefined) this.username = Username.normalize(body.username);
    if (body.avatar !== undefined) this.avatar = body.avatar;
    if (body.coverPhoto !== undefined) this.coverPhoto = body.coverPhoto;
  }
}
