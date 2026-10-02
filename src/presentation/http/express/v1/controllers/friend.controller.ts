import type { AcceptIncomingRequestPort } from '@/modules/relationship/application/use-cases/accept-incoming-request/accept-incoming-request.port';
import type { DeclineIncomingRequestPort } from '@/modules/relationship/application/use-cases/decline-incoming-request/decline-incoming-request.port';
import type { GetFriendsPort } from '@/modules/relationship/application/use-cases/get-friends/get-friends.port';
import type { GetIncomingRequestsPort } from '@/modules/relationship/application/use-cases/get-incoming-requests/get-incoming-requests.port';
import type { GetOutgoingRequestsPort } from '@/modules/relationship/application/use-cases/get-outgoing-requests/get-outgoing-requests.port';
import type { RevokeOutgoingRequestPort } from '@/modules/relationship/application/use-cases/revoke-outgoing-request/revoke-outgoing-request.port';
import type { SendFriendRequestPort } from '@/modules/relationship/application/use-cases/send-friend-request/send-friend-request.port';
import type { UnfriendPort } from '@/modules/relationship/application/use-cases/unfriend/unfriend.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type { CursorPaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import type {
  IncomingRequestParamsSchema,
  OutgoingRequestParamsSchema,
  SendFriendRequestBodySchema,
  UnfriendParamsSchema
} from '@/presentation/http/express/v1/schemas/friend/friend.request.schema';
import type {
  FriendRequestResponse,
  UserRecordResponse
} from '@/presentation/http/express/v1/schemas/friend/friend.response.schema';

type ListRequest = ValidatedRequest<{ query: typeof CursorPaginationQuerySchema }>;
type SendFriendRequestRequest = ValidatedRequest<{ body: typeof SendFriendRequestBodySchema }>;
type IncomingRequestRequest = ValidatedRequest<{ params: typeof IncomingRequestParamsSchema }>;
type OutgoingRequestRequest = ValidatedRequest<{ params: typeof OutgoingRequestParamsSchema }>;
type UnfriendRequest = ValidatedRequest<{ params: typeof UnfriendParamsSchema }>;

export interface IFriendController {
  listFriends(req: ListRequest): Promise<unknown>;
  listIncoming(req: ListRequest): Promise<unknown>;
  listOutgoing(req: ListRequest): Promise<unknown>;
  sendFriendRequest(req: SendFriendRequestRequest): Promise<unknown>;
  acceptIncomingRequest(req: IncomingRequestRequest): Promise<unknown>;
  declineIncomingRequest(req: IncomingRequestRequest): Promise<unknown>;
  revokeOutgoingRequest(req: OutgoingRequestRequest): Promise<unknown>;
  unfriend(req: UnfriendRequest): Promise<unknown>;
}

export class FriendController extends BaseController implements IFriendController {
  constructor(
    private readonly listFriendsUC: GetFriendsPort,
    private readonly listIncomingRequestsUC: GetIncomingRequestsPort,
    private readonly listOutgoingRequestsUC: GetOutgoingRequestsPort,
    private readonly sendFriendRequestUC: SendFriendRequestPort,
    private readonly acceptIncomingRequestUC: AcceptIncomingRequestPort,
    private readonly declineIncomingRequestUC: DeclineIncomingRequestPort,
    private readonly revokeOutgoingRequestUC: RevokeOutgoingRequestPort,
    private readonly unfriendUC: UnfriendPort
  ) {
    super();
  }

  @AutoBind()
  async listFriends(req: ListRequest) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listFriendsUC.execute({
      userId,
      limit,
      cursor
    });

    return this.cursorPaginatedResponse<UserRecordResponse>({
      items,
      nextCursor,
      message: 'Get friends successfully'
    });
  }

  @AutoBind()
  async listIncoming(req: ListRequest) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listIncomingRequestsUC.execute({
      userId,
      limit,
      cursor
    });

    return this.cursorPaginatedResponse<UserRecordResponse>({
      items,
      nextCursor,
      message: 'Get incoming friend requests successfully'
    });
  }

  @AutoBind()
  async listOutgoing(req: ListRequest) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listOutgoingRequestsUC.execute({
      userId,
      limit,
      cursor
    });

    return this.cursorPaginatedResponse<UserRecordResponse>({
      items,
      nextCursor,
      message: 'Get outgoing friend requests successfully'
    });
  }

  @AutoBind()
  async sendFriendRequest(req: SendFriendRequestRequest) {
    const userId = this.getUserId(req);
    const created = await this.sendFriendRequestUC.execute({ userId, username: req.body.username });

    return this.response<FriendRequestResponse>({
      instance: Created,
      data: created,
      message: 'Friend request sent successfully'
    });
  }

  @AutoBind()
  async acceptIncomingRequest(req: IncomingRequestRequest) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;

    await this.acceptIncomingRequestUC.execute({ userId, fromUserId });

    return this.response({ message: 'Friend request accepted successfully' });
  }

  @AutoBind()
  async declineIncomingRequest(req: IncomingRequestRequest) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;

    await this.declineIncomingRequestUC.execute({ userId, fromUserId });

    return this.response({ message: 'Friend request declined successfully' });
  }

  @AutoBind()
  async revokeOutgoingRequest(req: OutgoingRequestRequest) {
    const userId = this.getUserId(req);
    const { toUserId } = req.params;

    await this.revokeOutgoingRequestUC.execute({ userId, toUserId });

    return this.response({ message: 'Friend request revoked successfully' });
  }

  @AutoBind()
  async unfriend(req: UnfriendRequest) {
    const userId = this.getUserId(req);
    const { userId: otherUserId } = req.params;

    await this.unfriendUC.execute({ userId, otherUserId });

    return this.response({ message: 'Unfriend successfully' });
  }
}
