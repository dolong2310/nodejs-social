export interface IFriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt?: Date;
}

export class FriendRequestEntity {
  private _id: string;
  private _fromUserId: string;
  private _toUserId: string;
  private _createdAt?: Date;

  public get id(): string {
    return this._id;
  }

  private set id(value: string) {
    this._id = value;
  }

  public get fromUserId(): string {
    return this._fromUserId;
  }

  private set fromUserId(value: string) {
    this._fromUserId = value;
  }

  public get toUserId(): string {
    return this._toUserId;
  }

  private set toUserId(value: string) {
    this._toUserId = value;
  }

  public get createdAt(): Date | undefined {
    return this._createdAt;
  }

  private set createdAt(value: Date | undefined) {
    this._createdAt = value;
  }

  private constructor(data: IFriendRequest) {
    this._id = data.id;
    this._fromUserId = data.fromUserId;
    this._toUserId = data.toUserId;
    this._createdAt = data.createdAt ?? new Date();
  }

  public static create(data: IFriendRequest): FriendRequestEntity {
    return new FriendRequestEntity(data);
  }
}
