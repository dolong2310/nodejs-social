import { UseCase } from '@/modules/core/application/base.usecase';
import { UserRecordProps } from '@/modules/user/domain/entities/user.type';

export class GetFriendsQuery {
  userId: string;
  limit: number;
  cursor?: string;
  constructor(payload: { userId: string; limit: string; cursor?: string }) {
    this.userId = payload.userId;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetFriendsResult {
  items: UserRecordProps[];
  nextCursor: string | null;
  constructor(items: UserRecordProps[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}

export abstract class GetFriendsInPort implements UseCase<GetFriendsQuery, GetFriendsResult> {
  abstract execute(query: GetFriendsQuery): Promise<GetFriendsResult>;
}
