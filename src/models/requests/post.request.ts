import { PostAudience, PostType } from '@/enums/posts.enum';
import { IMedia } from '@/types/media.type';

export interface ICreatePostRequestBody {
  type: PostType;
  audience: PostAudience;
  content: string;
  parentId: string | null; // chỉ null khi post là bài viết gốc, nếu parentId là string thì post đó là bài viết con
  hashtags: string[]; // tên hashtags dạng ['javascript', 'nodejs']
  mentions: string[]; // userId[]
  media: IMedia[];
}
