import { UseCase } from '@/modules/core/application/base.usecase';

export class DeletePostInputPort {
  postId: string;
  userId: string;
  roleId: string;

  constructor(payload: { postId: string; userId: string; roleId: string }) {
    this.postId = payload.postId;
    this.userId = payload.userId;
    this.roleId = payload.roleId;
  }
}

export abstract class DeletePostPort implements UseCase<DeletePostInputPort, void> {
  abstract execute(input: DeletePostInputPort): Promise<void>;
}
