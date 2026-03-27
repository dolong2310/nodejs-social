/** Payload returned after a successful block (minimal contract for clients). */
export class BlockCreatedResponseDTO {
  userId: string;

  constructor(blockedUserId: string) {
    this.userId = blockedUserId;
  }
}
