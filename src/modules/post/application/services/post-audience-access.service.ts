import { transformUnknownAuthorForPostDetail } from '@/modules/post/application/utils/transform-unknown-user.util';
import {
  CannotViewPostBlockedException,
  GuestCannotAccessNonPublicPostException,
  OnlyFriendsCanViewPostsException,
  OnlyOwnerCanViewPostsException
} from '@/modules/post/application/post.exception';
import { UserIsBannedException, UserNotFoundException } from '@/modules/user/application/user.exception';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import { IPostDetailOutput } from '@/modules/post/application/ports/queries/post-query.type';
import { IBlockService } from '@/modules/block/application/services/block.service';
import { IFriendService } from '@/modules/friend/application/services/friend.service';
import { IUserService } from '@/modules/user/application/services/user.service';
import { EPostAudience } from '@/modules/post/domain/entities/post.type';
import { EUserStatus } from '@/modules/user/domain/entities/user.type';

export interface IPostAudienceAccessService {
  assertViewerCanAccessPostDetail(post: IPostDetailOutput, viewerUserId: string | undefined): Promise<void>;
}

export class PostAudienceAccessService implements IPostAudienceAccessService {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly blockService: IBlockService,
    private readonly userService: IUserService,
    private readonly friendsService: IFriendService
  ) {}

  async assertViewerCanAccessPostDetail(post: IPostDetailOutput, viewerUserId: string | undefined): Promise<void> {
    const ownerId = post.userId;
    const isGuestUser = !viewerUserId;
    const isOwner = !isGuestUser && ownerId === viewerUserId;

    const audienceStr = post.audience as string;
    const isPublicAudience = audienceStr === EPostAudience.PUBLIC;
    const isFriendsOnlyAudience = audienceStr === EPostAudience.FRIENDS_ONLY || audienceStr === 'followers';
    const isOnlyMeAudience = audienceStr === EPostAudience.ONLY_ME || audienceStr === 'only_me';

    if (isGuestUser) {
      if (!isPublicAudience) {
        throw GuestCannotAccessNonPublicPostException;
      }
      return;
    }

    if (isOwner) {
      const userOwner = await this.userService.findUserById(ownerId);
      if (!userOwner) {
        throw UserNotFoundException;
      }
      if (userOwner.status === EUserStatus.BANNED) {
        throw UserIsBannedException;
      }
    }

    if (isOnlyMeAudience && !isOwner) {
      throw OnlyOwnerCanViewPostsException;
    }

    if (isFriendsOnlyAudience) {
      const isMention = post.mentions.some((mention) => mention.id === viewerUserId);
      if (!isOwner && !isMention) {
        const isFriend = await this.friendsService.isFriendOf({
          userId: viewerUserId,
          otherUserId: ownerId
        });
        if (!isFriend) {
          throw OnlyFriendsCanViewPostsException;
        }
      }
    }

    if (!isOwner) {
      const blocked = await this.blockService.isBlockedEitherWay(viewerUserId, post.userId);
      if (blocked) {
        const isInteracted = await this.postQueryRepository.isViewerInteractedWithPost({
          viewerId: viewerUserId,
          postId: post.id
        });
        if (!isInteracted) {
          throw CannotViewPostBlockedException;
        }
        transformUnknownAuthorForPostDetail(post);
      }
    }
  }
}
