import {
  CannotViewPostBlockedException,
  GuestCannotAccessNonPublicPostException,
  OnlyFriendsCanViewPostsException,
  OnlyOwnerCanViewPostsException
} from '@/modules/post/application/exceptions/post.exception';
import { transformUnknownAuthorForPostDetail } from '@/modules/post/application/utils/transform-unknown-user.util';
import { EPostAudience } from '@/modules/post/domain/entities/post.type';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { IPostDetailOutput } from '@/modules/post/domain/repositories/post.query.type';
import { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import { UserIsBannedException, UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { EUserStatus } from '@/modules/user/domain/entities/user.type';

export interface PostAudienceAccessServicePort {
  assertViewerCanAccessPostDetail(post: IPostDetailOutput, viewerUserId: string | undefined): Promise<void>;
}

export class PostAudienceAccessService implements PostAudienceAccessServicePort {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly blockService: BlockServicePort,
    private readonly userService: UserServicePort,
    private readonly friendsService: FriendServicePort
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
        throw new GuestCannotAccessNonPublicPostException();
      }
      return;
    }

    if (isOwner) {
      const userOwner = await this.userService.findUserById(ownerId);
      if (!userOwner) {
        throw new UserNotFoundException();
      }
      if (userOwner.status === EUserStatus.BANNED) {
        throw new UserIsBannedException();
      }
    }

    if (isOnlyMeAudience && !isOwner) {
      throw new OnlyOwnerCanViewPostsException();
    }

    if (isFriendsOnlyAudience) {
      const isMention = post.mentions.some((mention) => mention.id === viewerUserId);
      if (!isOwner && !isMention) {
        const isFriend = await this.friendsService.isFriendOf({
          userId: viewerUserId,
          otherUserId: ownerId
        });
        if (!isFriend) {
          throw new OnlyFriendsCanViewPostsException();
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
          throw new CannotViewPostBlockedException();
        }
        transformUnknownAuthorForPostDetail(post);
      }
    }
  }
}
