import { CursorPaginationQueryDTO } from '@/application/dtos/common/common.payload.dto';
import {
  CreatePostPayloadDTO,
  FindPostByIdPayloadDTO,
  FindPostDetailPayloadDTO,
  GetExtraVisiblePostIdsForBlockedEngagementPayloadDTO,
  GetNewFeedsPayloadDTO,
  GetPostsTypePayloadDTO,
  IsViewerInteractedWithPostPayloadDTO,
  IncreaseViewsPayloadDTO,
  ListBlockedUserIdsEitherDirectionCachedPayloadDTO,
  PatchPostPayloadDTO,
  UpdatePostsViewsPayloadDTO
} from '@/application/dtos/post/post.payload.dto';
import {
  GetExtraVisiblePostIdsForBlockedEngagementResultDTO,
  IsViewerInteractedWithPostResultDTO,
  IncrementViewsResultDTO,
  ListBlockedUserIdsEitherDirectionCachedResultDTO,
  PostDetailPaginationResultDTO,
  PostDetailResultDTO,
  PostNewFeedPaginationResultDTO,
  PostNewFeedResultDTO,
  PostResultDTO
} from '@/application/dtos/post/post.result.dto';

export interface IPostsService {
  findPostDetail(payload: FindPostDetailPayloadDTO): Promise<PostDetailResultDTO | null>;
  getNewFeeds(payload: GetNewFeedsPayloadDTO): Promise<PostNewFeedPaginationResultDTO>;
  getGuestNewFeeds(payload: CursorPaginationQueryDTO): Promise<PostNewFeedPaginationResultDTO>;
  getPostsType(payload: GetPostsTypePayloadDTO): Promise<PostDetailPaginationResultDTO>;
  findPostById(payload: FindPostByIdPayloadDTO): Promise<PostResultDTO | null>;
  increaseViews(payload: IncreaseViewsPayloadDTO): Promise<IncrementViewsResultDTO | null>;
  createPost(payload: CreatePostPayloadDTO): Promise<PostResultDTO>;
  patchPost(payload: PatchPostPayloadDTO): Promise<PostResultDTO>;
  updatePostsViews<T extends PostDetailResultDTO | PostNewFeedResultDTO>(payload: UpdatePostsViewsPayloadDTO<T>): T[];
  isViewerInteractedWithPost(
    payload: IsViewerInteractedWithPostPayloadDTO
  ): Promise<IsViewerInteractedWithPostResultDTO>;
  getExtraVisiblePostIdsForBlockedEngagement(
    payload: GetExtraVisiblePostIdsForBlockedEngagementPayloadDTO
  ): Promise<GetExtraVisiblePostIdsForBlockedEngagementResultDTO>;
  listBlockedUserIdsEitherDirectionCached(
    payload: ListBlockedUserIdsEitherDirectionCachedPayloadDTO
  ): Promise<ListBlockedUserIdsEitherDirectionCachedResultDTO>;
}
