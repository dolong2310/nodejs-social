import { UseCase } from '@/modules/core/application/base.usecase';
import { UserRecordProps } from '@/modules/user/domain/entities/user.type';

export class GetIncomingRequestsQuery {
  userId: string;
  limit: number;
  cursor?: string;
  constructor(payload: { userId: string; limit: string; cursor?: string }) {
    this.userId = payload.userId;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetIncomingRequestsResult {
  items: UserRecordProps[];
  nextCursor: string | null;
  constructor(items: UserRecordProps[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}

export abstract class GetIncomingRequestsPort implements UseCase<
  GetIncomingRequestsQuery,
  GetIncomingRequestsResult
> {
  abstract execute(query: GetIncomingRequestsQuery): Promise<GetIncomingRequestsResult>;
}
