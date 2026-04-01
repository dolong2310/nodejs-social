import { ILike } from '@/modules/likes/likes.schema';

export class CreateLikeResponseDTO {
  _id: string;
  userId: string;
  postId: string;
  createdAt?: Date;

  constructor(like: ILike) {
    this._id = like._id.toString();
    this.userId = like.userId.toString();
    this.postId = like.postId.toString();
    this.createdAt = like.createdAt;
  }
}

export class DeleteLikeResponseDTO extends CreateLikeResponseDTO {
  constructor(like: ILike) {
    super(like);
  }
}
