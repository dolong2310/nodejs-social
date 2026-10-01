import { UseCase } from '@/modules/core/application/base.usecase';
import { FriendRequestFullProps } from '@/modules/relationship/domain/entities/friend-request.types';

export class SendFriendRequestInputPort {
  userId: string;
  username: string;

  constructor(payload: { userId: string; username: string }) {
    this.userId = payload.userId;
    this.username = payload.username;
  }
}

export class SendFriendRequestOutputPort implements FriendRequestFullProps {
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

export abstract class SendFriendRequestPort implements UseCase<
  SendFriendRequestInputPort,
  SendFriendRequestOutputPort
> {
  abstract execute(input: SendFriendRequestInputPort): Promise<SendFriendRequestOutputPort>;
}
