import { EUserStatus } from '@/modules/user/domain/entities/user.type';
import { UserSafeProps } from '@/modules/user/domain/entities/user.type';

export class UserResponseDTO implements UserSafeProps {
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

  constructor(user: UserSafeProps) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.birthday = user.birthday;
    this.roleId = user.roleId;
    this.status = user.status;
    this.bio = user.bio;
    this.location = user.location;
    this.website = user.website;
    this.username = user.username;
    this.avatar = user.avatar;
    this.coverPhoto = user.coverPhoto;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

export class ChangePasswordResponseDTO {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
