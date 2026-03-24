/**
 * BLCK-02 / Phase 4 D-11: consistent "unknown user" payloads when a viewer must not see a blocked author's PII
 * but may still see post content they previously engaged with (like, bookmark, or comment on that post).
 */
import { PostDetailResponseDTO, PostNewFeedResponseDTO } from '@/dtos/responses/post.response.dto';
import { IUser } from '@/models/user.schema';
import { ObjectId } from 'mongodb';

/** Sentinel id — not a real user; clients must not link to profile. */
export const REDACTED_USER_OBJECT_ID = new ObjectId('000000000000000000000000');

const UNKNOWN_FEED_AUTHOR: Pick<IUser, '_id' | 'name' | 'email' | 'username' | 'avatar'> = {
  _id: REDACTED_USER_OBJECT_ID,
  name: 'Unknown user',
  email: 'unknown@invalid',
  username: 'unknown',
  avatar: ''
};

const UNKNOWN_MENTION: Pick<IUser, '_id' | 'name' | 'email' | 'username' | 'verificationStatus'> = {
  _id: REDACTED_USER_OBJECT_ID,
  name: 'Unknown user',
  email: 'unknown@invalid',
  username: 'unknown',
  verificationStatus: undefined
};

export function redactNewFeedAuthor(post: PostNewFeedResponseDTO): void {
  post.author = { ...UNKNOWN_FEED_AUTHOR };
}

/** Redact root post author on detail DTO (mutates). */
export function redactPostDetailBlockedAuthor(post: PostDetailResponseDTO): void {
  const authorId = post.userId;
  post.userId = REDACTED_USER_OBJECT_ID;
  post.mentions = post.mentions.map((m) => (m._id.equals(authorId) ? { ...UNKNOWN_MENTION } : m));
}

/** Same shape as detail; used for comment rows where `userId` is the commenter. */
export function redactPostRowAuthorForBlock(post: PostDetailResponseDTO): void {
  redactPostDetailBlockedAuthor(post);
}
