import { UseCase } from '@/modules/core/application/base.usecase';
import { UserRecordProps } from '@/modules/user/domain/entities/user.type';

export class GetBlockedUserQuery {
  blockerUserId: string;
  page: string;
  limit: string;
  constructor(payload: { blockerUserId: string; page: string; limit: string }) {
    this.blockerUserId = payload.blockerUserId;
    this.page = payload.page;
    this.limit = payload.limit;
  }
}

export class GetBlockedUserResult {
  users: UserRecordProps[];
  total: number;
  constructor(payload: { users: UserRecordProps[]; total: number }) {
    this.users = payload.users;
    this.total = payload.total;
  }
}

export abstract class GetBlockedUserPort implements UseCase<GetBlockedUserQuery, GetBlockedUserResult> {
  abstract execute(query: GetBlockedUserQuery): Promise<GetBlockedUserResult>;
}
