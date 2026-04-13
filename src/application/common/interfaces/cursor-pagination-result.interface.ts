export interface ICursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
}
