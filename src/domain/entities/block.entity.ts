export interface IBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt?: Date;
}

export class BlockEntity {
  private _id!: string;
  private _blockerId!: string;
  private _blockedId!: string;
  private _createdAt?: Date;

  public get id(): string {
    return this._id;
  }
  public get blockerId(): string {
    return this._blockerId;
  }
  public get blockedId(): string {
    return this._blockedId;
  }
  public get createdAt(): Date | undefined {
    return this._createdAt;
  }

  private set id(value: string) {
    this._id = value;
  }
  private set blockerId(value: string) {
    this._blockerId = value;
  }
  private set blockedId(value: string) {
    this._blockedId = value;
  }
  private set createdAt(value: Date | undefined) {
    this._createdAt = value;
  }
  private constructor(data: IBlock) {
    this.id = data.id;
    this.blockerId = data.blockerId;
    this.blockedId = data.blockedId;
    this.createdAt = data.createdAt ?? new Date();
  }

  public static create(data: IBlock): BlockEntity {
    return new BlockEntity(data);
  }
}
