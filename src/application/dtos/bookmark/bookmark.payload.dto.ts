export class CreateBookmarkPayloadDTO {
  postId: string;
  userId: string;
  constructor(payload: { postId: string; userId: string }) {
    this.postId = payload.postId;
    this.userId = payload.userId;
  }
}

export class DeleteBookmarkPayloadDTO extends CreateBookmarkPayloadDTO {}
