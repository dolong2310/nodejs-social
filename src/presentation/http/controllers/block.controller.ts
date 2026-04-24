import { BlockUserInPort } from '@/application/use-cases/block/block-user/block-user.in-port';
import { GetBlockedUserInPort } from '@/application/use-cases/block/get-blocked-user/get-blocked-user.in-port';
import { UnblockUserInPort } from '@/application/use-cases/block/unblock-user/unblock-user.in-port';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { BlockUserBodyDTO, UnblockUserParamsDTO } from '@/presentation/http/dtos/block/block.request.dto';
import { BlockCreatedResponseDTO } from '@/presentation/http/dtos/block/block.response.dto';
import { PaginationQueryDTO } from '@/presentation/http/dtos/common/common.request.dto';
import { FriendUserResponseDTO } from '@/presentation/http/dtos/friend/friend.response.dto';
import { Created } from '@/presentation/http/responses/success.response';
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
