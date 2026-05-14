import { AcceptIncomingRequestPort } from '@/modules/relationship/application/use-cases/accept-incoming-request/accept-incoming-request.port';
import { DeclineIncomingRequestPort } from '@/modules/relationship/application/use-cases/decline-incoming-request/decline-incoming-request.port';
import { GetFriendsPort } from '@/modules/relationship/application/use-cases/get-friends/get-friends.port';
import { GetIncomingRequestsPort } from '@/modules/relationship/application/use-cases/get-incoming-requests/get-incoming-requests.port';
import { GetOutgoingRequestsPort } from '@/modules/relationship/application/use-cases/get-outgoing-requests/get-outgoing-requests.port';
import { RevokeOutgoingRequestPort } from '@/modules/relationship/application/use-cases/revoke-outgoing-request/revoke-outgoing-request.port';
import { SendFriendRequestPort } from '@/modules/relationship/application/use-cases/send-friend-request/send-friend-request.port';
import { UnfriendPort } from '@/modules/relationship/application/use-cases/unfriend/unfriend.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
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
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IFriendController {
  listFriends(
    req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  listIncoming(
    req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  listOutgoing(
    req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  sendFriendRequest(
    req: ExpressRequest<ParamsDictionary, object, SendFriendRequestBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  acceptIncomingRequest(
    req: ExpressRequest<AcceptDeclineRequestParamsDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  declineIncomingRequest(
    req: ExpressRequest<AcceptDeclineRequestParamsDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  revokeOutgoingRequest(
    req: ExpressRequest<RevokeOutgoingRequestParamsDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  unfriend(req: ExpressRequest<UnfriendParamsDTO>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
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
  async listFriends(req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
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
  async listIncoming(req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
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
  async listOutgoing(req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
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
  async sendFriendRequest(req: ExpressRequest<ParamsDictionary, object, SendFriendRequestBodyDTO>) {
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
  async acceptIncomingRequest(req: ExpressRequest<AcceptDeclineRequestParamsDTO>) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;

    await this.acceptIncomingRequestUC.execute({ userId, fromUserId });

    return this.response({ message: 'Friend request accepted successfully' });
  }

  @AutoBind()
  async declineIncomingRequest(req: ExpressRequest<AcceptDeclineRequestParamsDTO>) {
    const userId = this.getUserId(req);
    const { fromUserId } = req.params;

    await this.declineIncomingRequestUC.execute({ userId, fromUserId });

    return this.response({ message: 'Friend request declined successfully' });
  }

  @AutoBind()
  async revokeOutgoingRequest(req: ExpressRequest<RevokeOutgoingRequestParamsDTO>) {
    const userId = this.getUserId(req);
    const { toUserId } = req.params;

    await this.revokeOutgoingRequestUC.execute({ userId, toUserId });

    return this.response({ message: 'Friend request revoked successfully' });
  }

  @AutoBind()
  async unfriend(req: ExpressRequest<UnfriendParamsDTO>) {
    const userId = this.getUserId(req);
    const { userId: otherUserId } = req.params;

    await this.unfriendUC.execute({ userId, otherUserId });

    return this.response({ message: 'Unfriend successfully' });
  }
}
