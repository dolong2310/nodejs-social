export type DateIdCursor = {
  createdAt: Date;
  _id: string;
};

export interface ICursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
}
