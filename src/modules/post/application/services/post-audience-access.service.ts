import {
  CannotViewPostBlockedException,
  GuestCannotAccessNonPublicPostException,
  OnlyFriendsCanViewPostsException,
  OnlyOwnerCanViewPostsException
} from '@/modules/post/application/exceptions/post.exception';
import { transformUnknownAuthorForPostDetail } from '@/modules/post/application/utils/transform-unknown-user.util';
import { EnumPostAudience } from '@/modules/post/domain/entities/post.types';
import type { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import type { PostDetailOutput } from '@/modules/post/domain/repositories/post.query.types';
import type { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import type { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import { UserIsBannedException, UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import type { UserServicePort } from '@/modules/user/application/services/user.service';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.types';

export interface PostAudienceAccessServicePort {
  assertUserCanAccessPostDetail(post: PostDetailOutput, currentUserId: string | undefined): Promise<void>;
}

export class PostAudienceAccessService implements PostAudienceAccessServicePort {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly blockService: BlockServicePort,
    private readonly userService: UserServicePort,
    private readonly friendsService: FriendServicePort
  ) {}

  async assertUserCanAccessPostDetail(post: PostDetailOutput, currentUserId: string | undefined): Promise<void> {
    const ownerId = post.userId;
    const isGuestUser = !currentUserId;
    const isOwner = !isGuestUser && ownerId === currentUserId;

    const audienceStr = post.audience as string;
    const isPublicAudience = audienceStr === EnumPostAudience.PUBLIC;
    const isFriendsOnlyAudience = audienceStr === EnumPostAudience.FRIENDS_ONLY || audienceStr === 'followers';
    const isOnlyMeAudience = audienceStr === EnumPostAudience.ONLY_ME || audienceStr === 'only_me';

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
      if (userOwner.status === EnumUserStatus.BANNED) {
        throw new UserIsBannedException();
      }
    }

    if (isOnlyMeAudience && !isOwner) {
      throw new OnlyOwnerCanViewPostsException();
    }

    if (isFriendsOnlyAudience) {
      const isMention = post.mentions.some((mention) => mention.id === currentUserId);
      if (!isOwner && !isMention) {
        const isFriend = await this.friendsService.isFriendOf({
          userId: currentUserId,
          otherUserId: ownerId
        });
        if (!isFriend) {
          throw new OnlyFriendsCanViewPostsException();
        }
      }
    }

    if (!isOwner) {
      const blocked = await this.blockService.isBlockedEitherWay(currentUserId, post.userId);
      if (blocked) {
        const isInteracted = await this.postQueryRepository.isUserInteractedWithPost({
          userId: currentUserId,
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
