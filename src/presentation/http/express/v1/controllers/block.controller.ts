import { BlockUserPort } from '@/modules/relationship/application/use-cases/block-user/block-user.port';
import { GetBlockedUserPort } from '@/modules/relationship/application/use-cases/get-blocked-user/get-blocked-user.port';
import { UnblockUserPort } from '@/modules/relationship/application/use-cases/unblock-user/unblock-user.port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { BlockUserBodyDTO, UnblockUserParamsDTO } from '@/presentation/http/express/v1/dtos/block/block.request.dto';
import { BlockCreatedResponseDTO } from '@/presentation/http/express/v1/dtos/block/block.response.dto';
import { PaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import { FriendUserResponseDTO } from '@/presentation/http/express/v1/dtos/friend/friend.response.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBlockController {
  blockUser(req: Request<ParamsDictionary, object, BlockUserBodyDTO>): Promise<unknown>;
  unblockUser(req: Request<UnblockUserParamsDTO>): Promise<unknown>;
  listBlocked(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown>;
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
  async blockUser(req: Request<ParamsDictionary, object, BlockUserBodyDTO>) {
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
  async unblockUser(req: Request<UnblockUserParamsDTO>) {
    const blockerUserId = this.getUserId(req);
    const { userId: blockedUserId } = req.params;

    await this.unblockUserUC.execute({ blockerUserId, blockedUserId });

    return this.response({ message: 'User unblocked successfully' });
  }

  @AutoBind()
  async listBlocked(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>) {
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
