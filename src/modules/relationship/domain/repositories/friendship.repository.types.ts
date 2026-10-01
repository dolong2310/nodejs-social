export interface ListFriendIdsByCursorInput {
  userId: string;
  limit: number;
  cursor?: string;
}

export interface CountFriendshipsWithUserAmongOthersInput {
  userId: string;
  otherUserIds: string[];
}
