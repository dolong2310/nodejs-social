import type { UseCase } from '@/modules/core/application/base.usecase';
import type { UserRecordProps } from '@/modules/user/domain/entities/user.types';

export class GetBlockedUserInputPort {
  blockerUserId: string;
  page: number;
  limit: number;
  constructor(payload: { blockerUserId: string; page: number; limit: number }) {
    this.blockerUserId = payload.blockerUserId;
    this.page = payload.page;
    this.limit = payload.limit;
  }
}

export class GetBlockedUserOutputPort {
  users: UserRecordProps[];
  total: number;
  constructor(payload: { users: UserRecordProps[]; total: number }) {
    this.users = payload.users;
    this.total = payload.total;
  }
}

export abstract class GetBlockedUserPort implements UseCase<GetBlockedUserInputPort, GetBlockedUserOutputPort> {
  abstract execute(input: GetBlockedUserInputPort): Promise<GetBlockedUserOutputPort>;
}
