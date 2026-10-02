import type { BlockUserPort } from '@/modules/relationship/application/use-cases/block-user/block-user.port';
import type { GetBlockedUserPort } from '@/modules/relationship/application/use-cases/get-blocked-user/get-blocked-user.port';
import type { UnblockUserPort } from '@/modules/relationship/application/use-cases/unblock-user/unblock-user.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created, type SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type {
  BlockUserBodySchema,
  UnblockUserParamsSchema
} from '@/presentation/http/express/v1/schemas/block/block.request.schema';
import type { BlockCreatedResponse } from '@/presentation/http/express/v1/schemas/block/block.response.schema';
import type { PaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import type { UserRecordResponse } from '@/presentation/http/express/v1/schemas/friend/friend.response.schema';

type BlockUserRequest = ValidatedRequest<{ body: typeof BlockUserBodySchema }>;
type UnblockUserRequest = ValidatedRequest<{ params: typeof UnblockUserParamsSchema }>;
type ListBlockedRequest = ValidatedRequest<{ query: typeof PaginationQuerySchema }>;

export interface IBlockController {
  blockUser(req: BlockUserRequest): Promise<SuccessResponse<BlockCreatedResponse>>;
  unblockUser(req: UnblockUserRequest): Promise<SuccessResponse<unknown>>;
  listBlocked(req: ListBlockedRequest): Promise<unknown>;
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
  async blockUser(req: BlockUserRequest) {
    const { userId } = req.body;
    const blockerUserId = this.getUserId(req);

    await this.blockUserUC.execute({ blockerUserId, blockedUserId: userId });

    return this.response<BlockCreatedResponse>({
      instance: Created,
      data: { userId },
      message: 'User blocked successfully'
    });
  }

  @AutoBind()
  async unblockUser(req: UnblockUserRequest) {
    const blockerUserId = this.getUserId(req);
    const { userId: blockedUserId } = req.params;

    await this.unblockUserUC.execute({ blockerUserId, blockedUserId });

    return this.response({ message: 'User unblocked successfully' });
  }

  @AutoBind()
  async listBlocked(req: ListBlockedRequest) {
    const blockerUserId = this.getUserId(req);
    const { page, limit } = req.query;

    const { users, total } = await this.listBlockedUC.execute({ blockerUserId, page, limit });

    return this.paginatedResponse<UserRecordResponse[]>({
      data: users,
      pagination: { page, limit, totalItems: total },
      message: 'Get blocked users successfully'
    });
  }
}
