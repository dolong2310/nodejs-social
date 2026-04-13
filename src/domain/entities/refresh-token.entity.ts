export interface IRefreshToken {
  id: string;
  token: string;
  userId: string;
  createdAt?: Date;
}

export class RefreshTokenEntity {
  private _id!: string;
  private _token!: string;
  private _userId!: string;
  private _createdAt?: Date;

  public get id(): string {
    return this._id;
  }
  private set id(value: string) {
    this._id = value;
  }

  public get token(): string {
    return this._token;
  }
  private set token(value: string) {
    this._token = value;
  }

  public get userId(): string {
    return this._userId;
  }
  private set userId(value: string) {
    this._userId = value;
  }

  public get createdAt(): Date | undefined {
    return this._createdAt;
  }
  private set createdAt(value: Date | undefined) {
    this._createdAt = value;
  }
  private constructor(data: IRefreshToken) {
    this.id = data.id;
    this.token = data.token;
    this.userId = data.userId;
    this.createdAt = data.createdAt ?? new Date();
  }

  public static create(data: IRefreshToken): RefreshTokenEntity {
    return new RefreshTokenEntity(data);
  }
}
