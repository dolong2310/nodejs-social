import { UseCase } from '@/application/use-cases/base/base.usecase';
import { FriendRequestFullProps } from '@/domain/entities/friend-request/friend-request.type';

export class SendFriendRequestCommand {
  userId: string;
  toUserId: string;

  constructor(payload: { userId: string; toUserId: string }) {
    this.userId = payload.userId;
    this.toUserId = payload.toUserId;
  }
}

export class SendFriendRequestResult implements FriendRequestFullProps {
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

export abstract class SendFriendRequestInPort implements UseCase<SendFriendRequestCommand, SendFriendRequestResult> {
  abstract execute(command: SendFriendRequestCommand): Promise<SendFriendRequestResult>;
}
