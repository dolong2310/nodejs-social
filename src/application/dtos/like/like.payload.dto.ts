export class CreateLikePayloadDTO {
  userId: string;
  postId: string;
  constructor(payload: { userId: string; postId: string }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
  }
}

export class DeleteLikePayloadDTO extends CreateLikePayloadDTO {}
