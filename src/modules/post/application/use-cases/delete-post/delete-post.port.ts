import { UseCase } from '@/modules/core/application/base.usecase';

export class DeletePostCommand {
  postId: string;
  userId: string;
  roleId: string;

  constructor(payload: { postId: string; userId: string; roleId: string }) {
    this.postId = payload.postId;
    this.userId = payload.userId;
    this.roleId = payload.roleId;
  }
}

export abstract class DeletePostPort implements UseCase<DeletePostCommand, void> {
  abstract execute(command: DeletePostCommand): Promise<void>;
}
