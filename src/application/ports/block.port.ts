import {
  BlockUserPayloadDTO,
  ListBlockedUsersPayloadDTO,
  UnBlockUserPayloadDTO
} from '@/application/dtos/block/block.payload.dto';
import { ListBlockedUsersResultDTO } from '@/application/dtos/block/block.result.dto';

export interface IBlocksService {
  blockUser(payload: BlockUserPayloadDTO): Promise<void>;
  unblockUser(payload: UnBlockUserPayloadDTO): Promise<void>;
  listBlockedUsers(payload: ListBlockedUsersPayloadDTO): Promise<ListBlockedUsersResultDTO>;
}
