import { ILike } from '@/domain/entities/like.entity';

export class CreateLikeResultDTO {
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

export class DeleteLikeResultDTO extends CreateLikeResultDTO {}
