import { BlockUserInPort } from '@/modules/block/application/use-cases/block-user/block-user.in-port';
import { GetBlockedUserInPort } from '@/modules/block/application/use-cases/get-blocked-user/get-blocked-user.in-port';
import { UnblockUserInPort } from '@/modules/block/application/use-cases/unblock-user/unblock-user.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { BlockUserBodyDTO, UnblockUserParamsDTO } from '@/presentation/http/express/v1/dtos/block/block.request.dto';
import { BlockCreatedResponseDTO } from '@/presentation/http/express/v1/dtos/block/block.response.dto';
import { PaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import { FriendUserResponseDTO } from '@/presentation/http/express/v1/dtos/friend/friend.response.dto';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBlockController {
  blockUser(req: Request<ParamsDictionary, object, BlockUserBodyDTO>, res: Response): Promise<void>;
  unblockUser(req: Request<UnblockUserParamsDTO>, res: Response): Promise<void>;
  listBlocked(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response): Promise<void>;
}

export class BlockController extends BaseController implements IBlockController {
  constructor(
    private readonly blockUserUC: BlockUserInPort,
    private readonly unblockUserUC: UnblockUserInPort,
    private readonly listBlockedUC: GetBlockedUserInPort
  ) {
    super();
  }

  @AutoBind()
  async blockUser(req: Request<ParamsDictionary, object, BlockUserBodyDTO>, res: Response) {
    const dto = new BlockUserBodyDTO(req.body);
    const blockerUserId = this.getUserId(req);

    await this.blockUserUC.execute({ blockerUserId, blockedUserId: dto.userId });

    this.sendResponse<BlockCreatedResponseDTO>({
      res,
      instance: Created,
      data: new BlockCreatedResponseDTO(dto.userId),
      message: 'User blocked successfully'
    });
  }

  @AutoBind()
  async unblockUser(req: Request<UnblockUserParamsDTO>, res: Response) {
    const blockerUserId = this.getUserId(req);
    const { userId: blockedUserId } = req.params;

    await this.unblockUserUC.execute({ blockerUserId, blockedUserId });

    this.sendResponse({ res, message: 'User unblocked successfully' });
  }

  @AutoBind()
  async listBlocked(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response) {
    const blockerUserId = this.getUserId(req);
    const { page, limit } = req.query;

    const { users, total } = await this.listBlockedUC.execute({ blockerUserId, page, limit });

    this.sendPaginatedResponse<FriendUserResponseDTO[]>({
      res,
      data: users.map((user) => new FriendUserResponseDTO(user)),
      pagination: { page, limit, totalItems: total },
      message: 'Get blocked users successfully'
    });
  }
}
