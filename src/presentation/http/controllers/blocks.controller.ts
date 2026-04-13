import { IBlocksService } from '@/application/ports/block.port';

import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { BlockUserBodyDTO, UnblockUserParamsDTO } from '@/presentation/http/dtos/block/blocks.request.dto';
import { BlockCreatedResponseDTO } from '@/presentation/http/dtos/block/blocks.response.dto';
import { PaginationQueryDTO } from '@/presentation/http/dtos/common/common.request.dto';
import { FriendUserSummaryResponseDTO } from '@/presentation/http/dtos/friend/friends.response.dto';
import { Created } from '@/presentation/http/responses/success.response';

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBlocksController {
  blockUser(req: Request<ParamsDictionary, object, BlockUserBodyDTO>, res: Response): Promise<void>;
  unblockUser(req: Request<UnblockUserParamsDTO>, res: Response): Promise<void>;
  listBlocked(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response): Promise<void>;
}

export class BlocksController extends BaseController implements IBlocksController {
  constructor(private readonly blocksService: IBlocksService) {
    super();
  }

  @AutoBind()
  async blockUser(req: Request<ParamsDictionary, object, BlockUserBodyDTO>, res: Response) {
    const dto = new BlockUserBodyDTO(req.body);
    const blockerUserId = this.getUserId(req);
    await this.blocksService.blockUser({ blockerUserId, blockedUserId: dto.userId });
    this.sendResponse({
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
    await this.blocksService.unblockUser({ blockerUserId, blockedUserId });
    this.sendResponse({ res, message: 'User unblocked successfully' });
  }

  @AutoBind()
  async listBlocked(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response) {
    const blockerUserId = this.getUserId(req);
    const { page, limit } = req.query;
    const { users, total } = await this.blocksService.listBlockedUsers({ blockerUserId, page, limit });
    this.sendPaginatedResponse<FriendUserSummaryResponseDTO[]>({
      res,
      data: users.map((user) => new FriendUserSummaryResponseDTO(user)),
      pagination: { page, limit, totalItems: total },
      message: 'Get blocked users successfully'
    });
  }
}
