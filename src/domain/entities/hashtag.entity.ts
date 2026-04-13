export interface IHashtag {
  id: string;
  name: string;
  createdAt?: Date;
}

export class HashtagEntity {
  private _id!: string;
  private _name!: string;
  private _createdAt?: Date;

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get createdAt(): Date | undefined {
    return this._createdAt;
  }

  private set id(value: string) {
    this._id = value;
  }

  private set name(value: string) {
    this._name = value;
  }

  private set createdAt(value: Date | undefined) {
    this._createdAt = value;
  }
  private constructor(data: IHashtag) {
    this.id = data.id;
    this.name = data.name;
    this.createdAt = data.createdAt ?? new Date();
  }

  public static create(data: IHashtag): HashtagEntity {
    return new HashtagEntity(data);
  }
}
