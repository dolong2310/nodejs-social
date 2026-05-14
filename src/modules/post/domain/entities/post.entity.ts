import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { CreatePostProps, EnumPostAudience, EnumPostType, PostProps } from '@/modules/post/domain/entities/post.type';

export class PostEntity extends Entity<PostProps> {
  static create(createProps: CreatePostProps) {
    const id = new UniqueEntityID(generatePrefixId('post'));
    const props: PostProps = {
      ...createProps
    };
    const post = new PostEntity({ id, props });
    return post;
  }

  validate(): void {
    const { userId, type, audience, content, parentId, media, hashtags, mentions } = this.getProps();
    invariant(userId.trim().length > 0, new ArgumentNotProvidedException('User ID is required'));
    invariant(Object.values(EnumPostType).includes(type), new ArgumentInvalidException('Invalid post type'));
    invariant(
      Object.values(EnumPostAudience).includes(audience),
      new ArgumentInvalidException('Invalid post audience')
    );

    const hasContent = content.trim().length > 0;
    const hasMedia = media.length > 0;
    const requiresParent = type === EnumPostType.REPOST || type === EnumPostType.COMMENT || type === EnumPostType.QUOTE;
    invariant(
      !requiresParent || (parentId != null && parentId.trim().length > 0),
      new ArgumentNotProvidedException(`Parent post ID is required for a ${type}`)
    );
    invariant(
      type !== EnumPostType.POST || parentId === null,
      new ArgumentInvalidException('Parent post ID must be null for a post')
    );

    if (type === EnumPostType.POST) {
      invariant(hasContent || hasMedia, new ArgumentNotProvidedException('Post content or media is required'));
      return;
    }

    if (type === EnumPostType.REPOST) {
      invariant(!hasContent, new ArgumentInvalidException('Repost content must be empty'));
      invariant(!hasMedia, new ArgumentInvalidException('Repost media must be empty'));
      invariant(hashtags.length === 0, new ArgumentInvalidException('Repost hashtags must be empty'));
      invariant(mentions.length === 0, new ArgumentInvalidException('Repost mentions must be empty'));
      return;
    }

    invariant(hasContent, new ArgumentNotProvidedException(`${type} content is required`));
    invariant(!hasMedia, new ArgumentInvalidException(`${type} media must be empty`));
  }
}
