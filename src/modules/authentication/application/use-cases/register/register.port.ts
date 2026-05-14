import { UseCase } from '@/modules/core/application/base.usecase';
import { EnumUserStatus, UserSafeProps } from '@/modules/user/domain/entities/user.type';

export class RegisterCommand {
  name: string;
  email: string;
  password: string;
  birthday: string;
  code: string;
  constructor(payload: { name: string; email: string; password: string; birthday: string; code: string }) {
    this.name = payload.name.trim();
    this.email = payload.email.toLowerCase().trim();
    this.password = payload.password;
    this.birthday = payload.birthday;
    // TODO: create constant for code length
    if (payload.code.length !== 6) {
      throw new Error('Code must be 6 digits');
    }
    this.code = payload.code; // length 6 digits
  }
}

export class RegisterResult implements UserSafeProps {
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

export abstract class RegisterPort implements UseCase<RegisterCommand, RegisterResult> {
  abstract execute(command: RegisterCommand): Promise<RegisterResult>;
}
