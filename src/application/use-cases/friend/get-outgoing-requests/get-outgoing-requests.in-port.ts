import { UseCase } from '@/application/use-cases/base/base.usecase';
import { UserRecordProps } from '@/domain/entities/user/user.type';

export class GetOutgoingRequestsQuery {
  userId: string;
  limit: number;
  cursor?: string;
  constructor(payload: { userId: string; limit: string; cursor?: string }) {
    this.userId = payload.userId;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetOutgoingRequestsResult {
  items: UserRecordProps[];
  nextCursor: string | null;
  constructor(items: UserRecordProps[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}

export abstract class GetOutgoingRequestsInPort implements UseCase<
  GetOutgoingRequestsQuery,
  GetOutgoingRequestsResult
> {
  abstract execute(query: GetOutgoingRequestsQuery): Promise<GetOutgoingRequestsResult>;
}
