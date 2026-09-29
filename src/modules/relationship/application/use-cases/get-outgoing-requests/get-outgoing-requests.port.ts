import { UseCase } from '@/modules/core/application/base.usecase';
import { UserRecordProps } from '@/modules/user/domain/entities/user.type';

export class GetOutgoingRequestsInputPort {
  userId: string;
  limit: number;
  cursor?: string;
  constructor(payload: { userId: string; limit: string; cursor?: string }) {
    this.userId = payload.userId;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetOutgoingRequestsOutputPort {
  items: UserRecordProps[];
  nextCursor: string | null;
  constructor(items: UserRecordProps[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}

export abstract class GetOutgoingRequestsPort implements UseCase<
  GetOutgoingRequestsInputPort,
  GetOutgoingRequestsOutputPort
> {
  abstract execute(input: GetOutgoingRequestsInputPort): Promise<GetOutgoingRequestsOutputPort>;
}
