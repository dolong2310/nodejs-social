import { AcceptIncomingRequestInPort } from '@/modules/friend/application/use-cases/accept-incoming-request/accept-incoming-request.in-port';
import { DeclineIncomingRequestInPort } from '@/modules/friend/application/use-cases/decline-incoming-request/decline-incoming-request.in-port';
import { GetFriendsInPort } from '@/modules/friend/application/use-cases/get-friends/get-friends.in-port';
import { GetIncomingRequestsInPort } from '@/modules/friend/application/use-cases/get-incoming-requests/get-incoming-requests.in-port';
import { GetOutgoingRequestsInPort } from '@/modules/friend/application/use-cases/get-outgoing-requests/get-outgoing-requests.in-port';
import { RevokeOutgoingRequestInPort } from '@/modules/friend/application/use-cases/revoke-outgoing-request/revoke-outgoing-request.in-port';
import { SendFriendRequestInPort } from '@/modules/friend/application/use-cases/send-friend-request/send-friend-request.in-port';
import { UnfriendInPort } from '@/modules/friend/application/use-cases/unfriend/unfriend.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { CursorPaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  AcceptDeclineRequestParamsDTO,
  RevokeOutgoingRequestParamsDTO,
  SendFriendRequestBodyDTO,
  UnfriendParamsDTO
} from '@/presentation/http/express/v1/dtos/friend/friend.request.dto';
import {
  FriendRequestResponseDTO,
  FriendUserResponseDTO
} from '@/presentation/http/express/v1/dtos/friend/friend.response.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IFriendController {
  listFriends(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>): Promise<unknown>;
  listIncoming(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>): Promise<unknown>;
  listOutgoing(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>): Promise<unknown>;
  sendFriendRequest(req: Request<ParamsDictionary, object, SendFriendRequestBodyDTO>): Promise<unknown>;
  acceptIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>): Promise<unknown>;
  declineIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>): Promise<unknown>;
  revokeOutgoingRequest(req: Request<RevokeOutgoingRequestParamsDTO>): Promise<unknown>;
  unfriend(req: Request<UnfriendParamsDTO>): Promise<unknown>;
}

export class FriendController extends BaseController implements IFriendController {
  constructor(
    private readonly listFriendsUC: GetFriendsInPort,
    private readonly listIncomingRequestsUC: GetIncomingRequestsInPort,
    private readonly listOutgoingRequestsUC: GetOutgoingRequestsInPort,
    private readonly sendFriendRequestUC: SendFriendRequestInPort,
    private readonly acceptIncomingRequestUC: AcceptIncomingRequestInPort,
    private readonly declineIncomingRequestUC: DeclineIncomingRequestInPort,
    private readonly revokeOutgoingRequestUC: RevokeOutgoingRequestInPort,
    private readonly unfriendUC: UnfriendInPort
  ) {
    super();
  }

  @AutoBind()
  async listFriends(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listFriendsUC.execute({
      userId,
      limit: Number(limit),
      cursor
    });

    return this.cursorPaginatedResponse<FriendUserResponseDTO>({
      items,
      nextCursor,
      message: 'Get friends successfully'
    });
  }

  @AutoBind()
  async listIncoming(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listIncomingRequestsUC.execute({
      userId,
      limit: Number(limit),
      cursor
    });

    return this.cursorPaginatedResponse<FriendUserResponseDTO>({
      items,
      nextCursor,
      message: 'Get incoming friend requests successfully'
    });
  }

  @AutoBind()
  async listOutgoing(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listOutgoingRequestsUC.execute({
      userId,
      limit: Number(limit),
      cursor
    });

    return this.cursorPaginatedResponse<FriendUserResponseDTO>({
      items,
      nextCursor,
      message: 'Get outgoing friend requests successfully'
    });
  }

  @AutoBind()
  async sendFriendRequest(req: Request<ParamsDictionary, object, SendFriendRequestBodyDTO>) {
    console.log('req.body: ', req.body);
    const userId = this.getUserId(req);
    console.log('userId: ', userId);
    const dto = new SendFriendRequestBodyDTO(req.body);
    console.log('dto: ', dto);
    const created = await this.sendFriendRequestUC.execute({ userId, toUserId: dto.toUserId });

    return this.response<FriendRequestResponseDTO>({
      instance: Created,
      data: new FriendRequestResponseDTO(created),
      message: 'Friend request sent successfully'
    });
  }

  @AutoBind()
  async acceptIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;

    await this.acceptIncomingRequestUC.execute({ userId, fromUserId });

    return this.response({ message: 'Friend request accepted successfully' });
  }

  @AutoBind()
  async declineIncomingRequest(req: Request<AcceptDeclineRequestParamsDTO>) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;

    await this.declineIncomingRequestUC.execute({ userId, fromUserId });

    return this.response({ message: 'Friend request declined successfully' });
  }

  @AutoBind()
  async revokeOutgoingRequest(req: Request<RevokeOutgoingRequestParamsDTO>) {
    const userId = this.getUserId(req);
    const { toUserId } = req.params;

    await this.revokeOutgoingRequestUC.execute({ userId, toUserId });

    return this.response({ message: 'Friend request revoked successfully' });
  }

  @AutoBind()
  async unfriend(req: Request<UnfriendParamsDTO>) {
    const userId = this.getUserId(req);
    const { userId: otherUserId } = req.params;

    await this.unfriendUC.execute({ userId, otherUserId });

    return this.response({ message: 'Unfriend successfully' });
  }
}
