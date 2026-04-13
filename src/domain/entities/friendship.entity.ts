export interface IFriendship {
  id: string;
  userIdLow: string;
  userIdHigh: string;
  createdAt?: Date;
}

export class FriendshipEntity {
  private _id!: string;
  private _userIdLow!: string;
  private _userIdHigh!: string;
  private _createdAt?: Date;

  public get id(): string {
    return this._id;
  }

  private set id(value: string) {
    this._id = value;
  }

  public get userIdLow(): string {
    return this._userIdLow;
  }

  private set userIdLow(value: string) {
    this._userIdLow = value;
  }

  public get userIdHigh(): string {
    return this._userIdHigh;
  }

  private set userIdHigh(value: string) {
    this._userIdHigh = value;
  }

  public get createdAt(): Date | undefined {
    return this._createdAt;
  }

  private set createdAt(value: Date | undefined) {
    this._createdAt = value;
  }
  private constructor(data: IFriendship) {
    this.id = data.id;
    this.userIdLow = data.userIdLow;
    this.userIdHigh = data.userIdHigh;
    this.createdAt = data.createdAt ?? new Date();
  }

  public static create(data: IFriendship): FriendshipEntity {
    return new FriendshipEntity(data);
  }
}
