export function entityDouble<TObject extends object>(object: TObject): { toObject(): TObject } {
  return {
    toObject: () => object
  };
}

export function idDouble(id: string): { id: { toString(): string } } {
  return {
    id: {
      toString: () => id
    }
  };
}
