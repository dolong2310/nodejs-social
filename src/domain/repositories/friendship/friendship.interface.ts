export interface IFindFriendIdsByUserIdInput {
  userId: string;
}

export interface IListFriendIdsByCursorInput {
  userId: string;
  limit: number;
  cursor?: string;
}

export interface IFindFriendshipPairInput {
  aUserId: string;
  bUserId: string;
}

export interface ICreateFriendshipInput {
  aUserId: string;
  bUserId: string;
}

export interface IDeleteFriendshipInput {
  aUserId: string;
  bUserId: string;
}

export interface ICountFriendshipsWithUserAmongOthersInput {
  userId: string;
  otherUserIds: string[];
}
