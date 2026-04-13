export interface ILike {
  id: string;
  userId: string;
  postId: string;
  createdAt?: Date;
}

export class LikeEntity {
  private _id!: string;
  private _userId!: string;
  private _postId!: string;
  private _createdAt?: Date;

  public get id(): string {
    return this._id;
  }

  private set id(value: string) {
    this._id = value;
  }

  public get userId(): string {
    return this._userId;
  }

  private set userId(value: string) {
    this._userId = value;
  }

  public get postId(): string {
    return this._postId;
  }

  private set postId(value: string) {
    this._postId = value;
  }

  public get createdAt(): Date | undefined {
    return this._createdAt;
  }

  private set createdAt(value: Date | undefined) {
    this._createdAt = value;
  }
  private constructor(data: ILike) {
    this.id = data.id;
    this.userId = data.userId;
    this.postId = data.postId;
    this.createdAt = data.createdAt ?? new Date();
  }

  public static create(data: ILike): LikeEntity {
    return new LikeEntity(data);
  }
}
