import {
  BaseController,
  BlockCreatedResponseDTO,
  BlockUserBodyDTO,
  FriendUserSummaryResponseDTO,
  IBlocksService,
  UnblockUserParamsDTO
} from '@/modules';
import { Created } from '@/providers';
import { PaginationQueryDTO } from '@/shared';
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

  blockUser = async (req: Request<ParamsDictionary, object, BlockUserBodyDTO>, res: Response) => {
    const blockerUserId = this.getUserId(req);
    const dto = new BlockUserBodyDTO(req.body);
    await this.blocksService.blockUser(blockerUserId, dto.userId);
    this.sendResponse({
      res,
      instance: Created,
      data: new BlockCreatedResponseDTO(dto.userId),
      message: 'User blocked successfully'
    });
  };

  unblockUser = async (req: Request<UnblockUserParamsDTO>, res: Response) => {
    const blockerUserId = this.getUserId(req);
    const { userId: blockedUserId } = req.params;
    await this.blocksService.unblockUser(blockerUserId, blockedUserId);
    this.sendResponse({ res, message: 'User unblocked successfully' });
  };

  listBlocked = async (req: Request<ParamsDictionary, object, object, PaginationQueryDTO>, res: Response) => {
    const blockerUserId = this.getUserId(req);
    const { page, limit } = req.query;
    const { users, total } = await this.blocksService.listBlockedUsers(blockerUserId, page, limit);
    this.sendPaginatedResponse<FriendUserSummaryResponseDTO[]>({
      res,
      data: users.map((u) => new FriendUserSummaryResponseDTO(u)),
      pagination: { page, limit, totalItems: total },
      message: 'Get blocked users successfully'
    });
  };
}
