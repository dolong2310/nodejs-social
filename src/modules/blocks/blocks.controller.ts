import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import { BlocksService } from '@/modules/blocks/blocks.service';
import { BlockUserBodyDTO, UnblockUserParamsDTO } from '@/modules/blocks/dtos/blocks.request.dto';
import { BlockCreatedResponseDTO } from '@/modules/blocks/dtos/blocks.response.dto';
import { FriendUserSummaryResponseDTO } from '@/modules/friends/dtos/friends.response.dto';
import { Created } from '@/providers/httpResponses/success.response';
import { PaginationQueryDTO } from '@/shared/dtos/common.request.dto';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBlocksController {
  blockUser(req: Request<ParamsDictionary, object, BlockUserBodyDTO>, res: Response): Promise<void>;
  unblockUser(req: Request<UnblockUserParamsDTO>, res: Response): Promise<void>;
  listBlocked(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response): Promise<void>;
}

@Injectable()
export class BlocksController extends BaseController implements IBlocksController {
  constructor(private readonly blocksService: BlocksService) {
    super();
  }

  @AutoBind()
  async blockUser(req: Request<ParamsDictionary, object, BlockUserBodyDTO>, res: Response) {
    const blockerUserId = this.getUserId(req);
    const dto = new BlockUserBodyDTO(req.body);
    await this.blocksService.blockUser(blockerUserId, dto.userId);
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
    await this.blocksService.unblockUser(blockerUserId, blockedUserId);
    this.sendResponse({ res, message: 'User unblocked successfully' });
  }

  @AutoBind()
  async listBlocked(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response) {
    const blockerUserId = this.getUserId(req);
    const { page, limit } = req.query;
    const { users, total } = await this.blocksService.listBlockedUsers(blockerUserId, page, limit);
    this.sendPaginatedResponse<FriendUserSummaryResponseDTO[]>({
      res,
      data: users.map((u) => new FriendUserSummaryResponseDTO(u)),
      pagination: { page, limit, totalItems: total },
      message: 'Get blocked users successfully'
    });
  }
}
