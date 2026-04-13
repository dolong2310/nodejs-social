import { ILike } from '@/domain/entities/like.entity';

export class CreateLikeResponseDTO {
  id: string;
  userId: string;
  postId: string;
  createdAt?: Date;

  constructor(like: ILike) {
    this.id = like.id;
    this.userId = like.userId;
    this.postId = like.postId;
    this.createdAt = like.createdAt;
  }
}

export class DeleteLikeResponseDTO extends CreateLikeResponseDTO {
  constructor(like: ILike) {
    super(like);
  }
}
