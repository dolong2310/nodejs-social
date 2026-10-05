import { cursorPaginatedSchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import { PostDetailWithAuthorResponseSchema } from '@/presentation/http/express/v1/schemas/post/post.response.schema';
import { UserResponseSchema } from '@/presentation/http/express/v1/schemas/user/user.response.schema';
import { union } from 'valibot';

/** `type=user` returns users, every other type returns posts. */
export const SearchResponseSchema = cursorPaginatedSchema(
  union([UserResponseSchema, PostDetailWithAuthorResponseSchema])
);
