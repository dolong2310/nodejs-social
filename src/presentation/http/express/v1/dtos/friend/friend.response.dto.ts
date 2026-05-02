import { FriendRequestFullProps } from '@/modules/friend/domain/entities/friend-request.type';
import { UserRecordProps } from '@/modules/user/domain/entities/user.type';

export class FriendUserResponseDTO implements UserRecordProps {
  id: string;
  name: string;
  username?: string;
  avatar?: string;

  constructor(user: UserRecordProps) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.avatar = user.avatar;
  }
}

export class FriendRequestResponseDTO implements FriendRequestFullProps {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(request: FriendRequestFullProps) {
    this.id = request.id;
    this.fromUserId = request.fromUserId;
    this.toUserId = request.toUserId;
    this.createdAt = request.createdAt;
    this.updatedAt = request.updatedAt;
  }
}
