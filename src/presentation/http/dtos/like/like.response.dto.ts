import { LikeFullProps } from '@/domain/entities/like/like.type';

export class CreateLikeResponseDTO implements LikeFullProps {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(like: LikeFullProps) {
    this.id = like.id;
    this.userId = like.userId;
    this.postId = like.postId;
    this.createdAt = like.createdAt;
    this.updatedAt = like.updatedAt;
  }
}

export class DeleteLikeResponseDTO extends CreateLikeResponseDTO {
  constructor(like: LikeFullProps) {
    super(like);
  }
}
