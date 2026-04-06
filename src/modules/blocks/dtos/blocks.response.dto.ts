export class BlockCreatedResponseDTO {
  userId: string;

  constructor(blockedUserId: string) {
    this.userId = blockedUserId;
  }
}
