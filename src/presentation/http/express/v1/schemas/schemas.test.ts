import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { generateId } from '@/modules/core/domain/helpers/ids';
import { EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.types';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.types';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { mapValibotIssues } from '@/presentation/http/express/utils/valibot-error.util';
import { NotificationListQuerySchema } from '@/presentation/http/express/v1/schemas/notification/notification.request.schema';
import { CreatePaymentBodySchema } from '@/presentation/http/express/v1/schemas/payment/payment.request.schema';
import { PaymentResponseSchema } from '@/presentation/http/express/v1/schemas/payment/payment.response.schema';
import { CreatePostBodySchema } from '@/presentation/http/express/v1/schemas/post/post.request.schema';
import { PostDetailWithAuthorResponseSchema } from '@/presentation/http/express/v1/schemas/post/post.response.schema';
import { CreateRoleBodySchema } from '@/presentation/http/express/v1/schemas/role/role.request.schema';
import { PatchConversationMemberRoleBodySchema } from '@/presentation/http/express/v1/schemas/conversation/conversation.request.schema';
import { FilenameParamsSchema } from '@/presentation/http/express/v1/schemas/media/media.request.schema';
import { type GenericSchema, safeParse } from 'valibot';
import { describe, expect, it } from 'vitest';

function errorsOf(schema: GenericSchema, input: unknown) {
  const result = safeParse(schema, input);
  return result.success ? {} : mapValibotIssues(result.issues, 'body');
}

const basePost = {
  type: EnumPostType.POST,
  audience: EnumPostAudience.PUBLIC,
  allowStrangerComments: true,
  content: 'hello',
  parentId: null,
  hashtags: [],
  mentions: [],
  media: []
};

describe('CreatePostBodySchema', () => {
  it('accepts a post and converts media items to Media value objects', () => {
    const result = safeParse(CreatePostBodySchema, {
      ...basePost,
      content: '  ',
      media: [{ url: 'https://cdn.example.com/a.png', type: EnumMediaType.IMAGE }]
    });

    if (!result.success) throw new Error('Expected the post to be valid');
    expect(result.output.content).toBe('');
    expect(result.output.media[0]).toBeInstanceOf(Media);
  });

  it('requires content or media for a post', () => {
    expect(errorsOf(CreatePostBodySchema, { ...basePost, content: '' })).toEqual({
      content: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.POST_CONTENT_OR_MEDIA_REQUIRED })
    });
  });

  it('requires a null parentId for a post and a valid parentId for comments', () => {
    expect(errorsOf(CreatePostBodySchema, { ...basePost, parentId: generateId() })).toEqual({
      parentId: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_NULL })
    });
    expect(errorsOf(CreatePostBodySchema, { ...basePost, type: EnumPostType.COMMENT, parentId: 'abc' })).toEqual({
      parentId: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_A_VALID_POST_ID })
    });
  });

  it('applies the repost restrictions', () => {
    const errors = errorsOf(CreatePostBodySchema, {
      ...basePost,
      type: EnumPostType.REPOST,
      parentId: generateId(),
      content: 'not empty',
      hashtags: ['tag'],
      mentions: [generateId()],
      media: [{ url: 'https://cdn.example.com/a.png', type: EnumMediaType.IMAGE }]
    });

    expect(errors).toEqual({
      content: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_EMPTY_STRING }),
      hashtags: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.REPOST_HASHTAGS_MUST_BE_EMPTY }),
      mentions: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.REPOST_MENTIONS_MUST_BE_EMPTY }),
      media: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_EMPTY_FOR_THIS_POST_TYPE })
    });
  });

  it('rejects an invalid media item', () => {
    const errors = errorsOf(CreatePostBodySchema, { ...basePost, media: [{ url: 'not-a-url', type: 'image' }] });

    expect(errors['media.0']).toMatchObject({
      msg: VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS
    });
  });

  it('rejects an invalid post type', () => {
    expect(errorsOf(CreatePostBodySchema, { ...basePost, type: 'story' }).type).toMatchObject({
      msg: VALIDATION_ERROR_MESSAGE.INVALID_POST_TYPE
    });
  });
});

describe('PostDetailWithAuthorResponseSchema', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const detail = {
    id: 'p1',
    userId: 'u1',
    type: EnumPostType.QUOTE,
    audience: EnumPostAudience.PUBLIC,
    allowStrangerComments: true,
    content: 'quote',
    parentId: 'p0',
    hashtags: [{ id: 'h1', name: 'tag', createdAt: now, updatedAt: now, createdById: 'x' }],
    mentions: [{ id: 'u2', name: 'B', email: 'b@example.com', status: EnumUserStatus.ACTIVE, password: 'x' }],
    media: [],
    createdAt: now,
    updatedAt: now,
    likeCount: 0,
    bookmarkCount: 0,
    likedByMe: false,
    bookmarkedByMe: false,
    repostCount: 0,
    commentCount: 0,
    quoteCount: 0,
    author: { id: 'u1', name: 'A', email: 'a@example.com', password: 'secret' }
  };

  it('parses the recursive source post, defaults views and strips undeclared fields', () => {
    const result = safeParse(PostDetailWithAuthorResponseSchema, {
      ...detail,
      deletedAt: null,
      sourcePost: { ...detail, id: 'p0', parentId: null, type: EnumPostType.POST }
    });

    expect(result.success).toBe(true);
    const output = result.output;
    expect(output).not.toHaveProperty('deletedAt');
    expect(output).toHaveProperty('guestViews', 0);
    expect(output).not.toHaveProperty(['author', 'password']);
    expect(output).not.toHaveProperty(['mentions', 0, 'password']);
    expect(output).not.toHaveProperty(['hashtags', 0, 'createdById']);
    expect(output).toMatchObject({ sourcePost: { id: 'p0', sourcePost: null } });
  });
});

describe('payment schemas', () => {
  const body = { provider: 'vnpay', sourceReference: ' order_1 ', description: 'Order', amountVnd: '10000' };

  it('trims strings and coerces a numeric string amount', () => {
    const result = safeParse(CreatePaymentBodySchema, body);

    expect(result.output).toEqual({ ...body, sourceReference: 'order_1', amountVnd: 10_000 });
  });

  it('rejects an out-of-range amount and an unsupported provider', () => {
    expect(errorsOf(CreatePaymentBodySchema, { ...body, provider: 'bank', amountVnd: 9_999 })).toEqual({
      provider: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.PAYMENT_PROVIDER_INVALID }),
      amountVnd: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.PAYMENT_AMOUNT_INVALID })
    });
  });

  it('maps the payment to the public shape and hides an expired checkout URL', () => {
    const now = new Date();
    const payment = {
      id: 'pay-1',
      sourceReference: 'order_1',
      description: 'Order',
      amountVnd: 10_000,
      currency: 'VND',
      provider: 'vnpay',
      status: 'pending',
      checkoutUrl: 'https://pay.example.com',
      expiresAt: new Date(now.getTime() - 1000),
      createdAt: now,
      updatedAt: now,
      providerOrderId: 'internal'
    };

    const result = safeParse(PaymentResponseSchema, payment);

    expect(result.output).toMatchObject({ paymentId: 'pay-1', checkoutUrl: null });
    expect(result.output).not.toHaveProperty('id');
    expect(result.output).not.toHaveProperty('providerOrderId');
  });
});

describe('small schemas', () => {
  it('parses unreadOnly into a boolean', () => {
    expect(safeParse(NotificationListQuerySchema, { limit: '10', unreadOnly: '1' }).output).toEqual({
      limit: 10,
      unreadOnly: true
    });
  });

  it('defaults role isActive to true', () => {
    expect(safeParse(CreateRoleBodySchema, { name: 'EDITOR' }).output).toEqual({ name: 'EDITOR', isActive: true });
  });

  it('only allows manager/member when changing a conversation role', () => {
    expect(safeParse(PatchConversationMemberRoleBodySchema, { role: 'manager' }).success).toBe(true);
    expect(safeParse(PatchConversationMemberRoleBodySchema, { role: 'admin' }).success).toBe(false);
    expect(safeParse(PatchConversationMemberRoleBodySchema, { role: 'man' }).success).toBe(false);
  });

  it('rejects path traversal in static file names', () => {
    expect(safeParse(FilenameParamsSchema, { filename: 'a1b2.png' }).success).toBe(true);
    expect(safeParse(FilenameParamsSchema, { filename: '..' }).success).toBe(false);
    expect(safeParse(FilenameParamsSchema, { filename: '../etc/passwd' }).success).toBe(false);
  });
});
