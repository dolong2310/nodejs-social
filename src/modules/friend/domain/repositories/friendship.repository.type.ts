export interface IListFriendIdsByCursorInput {
  userId: string;
  limit: number;
  cursor?: string;
}

export interface ICountFriendshipsWithUserAmongOthersInput {
  userId: string;
  otherUserIds: string[];
}
