import {
  ICreateBlockInput,
  IDeleteBlockInput,
  IIsBlockedEitherWayInput,
  IListBlockedUserIdsForBlockerInput,
  IListBlockedUserIdsForBlockerOutput,
  IListUserIdsBlockedInEitherDirectionInput,
  IListUserIdsBlockedInEitherDirectionOutput
} from '@/domain/repositories/block/block.interface';

export interface IBlockRepository {
  isBlockedEitherWay(data: IIsBlockedEitherWayInput): Promise<boolean>;
  listBlockedUserIdsForBlocker(data: IListBlockedUserIdsForBlockerInput): Promise<IListBlockedUserIdsForBlockerOutput>;
  listUserIdsBlockedInEitherDirection(
    data: IListUserIdsBlockedInEitherDirectionInput
  ): Promise<IListUserIdsBlockedInEitherDirectionOutput>;
  createBlock(data: ICreateBlockInput): Promise<void>;
  deleteBlock(data: IDeleteBlockInput): Promise<number>;
}
