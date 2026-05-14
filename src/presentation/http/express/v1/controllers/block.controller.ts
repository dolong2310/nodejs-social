import { BlockUserPort } from '@/modules/relationship/application/use-cases/block-user/block-user.port';
import { GetBlockedUserPort } from '@/modules/relationship/application/use-cases/get-blocked-user/get-blocked-user.port';
import { UnblockUserPort } from '@/modules/relationship/application/use-cases/unblock-user/unblock-user.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created, SuccessResponse } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { BlockUserBodyDTO, UnblockUserParamsDTO } from '@/presentation/http/express/v1/dtos/block/block.request.dto';
import { BlockCreatedResponseDTO } from '@/presentation/http/express/v1/dtos/block/block.response.dto';
import { PaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import { FriendUserResponseDTO } from '@/presentation/http/express/v1/dtos/friend/friend.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBlockController {
  blockUser(
    req: ExpressRequest<ParamsDictionary, object, BlockUserBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<BlockCreatedResponseDTO>>;
  unblockUser(
    req: ExpressRequest<UnblockUserParamsDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<unknown>>;
  listBlocked(
    req: ExpressRequest<ParamsDictionary, object, object, PaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
}

export class BlockController extends BaseController implements IBlockController {
  constructor(
    private readonly blockUserUC: BlockUserPort,
    private readonly unblockUserUC: UnblockUserPort,
    private readonly listBlockedUC: GetBlockedUserPort
  ) {
    super();
  }

  @AutoBind()
  async blockUser(req: ExpressRequest<ParamsDictionary, object, BlockUserBodyDTO>) {
    const dto = new BlockUserBodyDTO(req.body);
    const blockerUserId = this.getUserId(req);

    await this.blockUserUC.execute({ blockerUserId, blockedUserId: dto.userId });

    return this.response<BlockCreatedResponseDTO>({
      instance: Created,
      data: new BlockCreatedResponseDTO(dto.userId),
      message: 'User blocked successfully'
    });
  }

  @AutoBind()
  async unblockUser(req: ExpressRequest<UnblockUserParamsDTO>) {
    const blockerUserId = this.getUserId(req);
    const { userId: blockedUserId } = req.params;

    await this.unblockUserUC.execute({ blockerUserId, blockedUserId });

    return this.response({ message: 'User unblocked successfully' });
  }

  @AutoBind()
  async listBlocked(req: ExpressRequest<ParamsDictionary, object, object, PaginationQueryDTO>) {
    const blockerUserId = this.getUserId(req);
    const { page, limit } = req.query;

    const { users, total } = await this.listBlockedUC.execute({ blockerUserId, page, limit });

    return this.paginatedResponse<FriendUserResponseDTO[]>({
      data: users.map((user) => new FriendUserResponseDTO(user)),
      pagination: { page, limit, totalItems: total },
      message: 'Get blocked users successfully'
    });
  }
}
