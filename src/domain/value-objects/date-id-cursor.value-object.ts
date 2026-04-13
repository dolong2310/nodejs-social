export class DateIdCursor {
  private _id: string;
  private _createdAt: Date;

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private constructor(id: string, createdAt: Date) {
    this._id = id;
    this._createdAt = createdAt;
  }

  static create(id: string, createdAt: Date): DateIdCursor {
    return new DateIdCursor(id, createdAt);
  }
}
