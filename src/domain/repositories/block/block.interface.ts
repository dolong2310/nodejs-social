import { BlockEntity } from '@/domain/entities/block.entity';

export interface IIsBlockedEitherWayInput {
  aUserId: string;
  bUserId: string;
}

export interface IListUserIdsBlockedInEitherDirectionInput {
  viewerUserId: string;
}

export interface ICreateBlockInput extends Pick<BlockEntity, 'blockerId' | 'blockedId'> {}

export interface IDeleteBlockInput extends Pick<BlockEntity, 'blockerId' | 'blockedId'> {}

export interface IListBlockedUserIdsForBlockerInput extends Pick<BlockEntity, 'blockerId'> {}

export interface IListBlockedUserIdsForBlockerOutput {
  ids: string[];
}

export interface IListUserIdsBlockedInEitherDirectionOutput {
  ids: string[];
}
