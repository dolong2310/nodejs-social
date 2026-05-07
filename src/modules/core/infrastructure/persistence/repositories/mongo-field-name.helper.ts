export function toMongoFieldName(field: string): string {
  if (field === 'id' || field === '_id') return '_id';
  return field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toMongoFieldPath(path: string): string {
  if (path.startsWith('$')) return path;
  return path.split('.').map(toMongoFieldName).join('.');
}

export function toMongoFieldRecord<T extends Record<string, unknown>>(record: T): Record<string, unknown> {
  return Object.entries(record).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[toMongoFieldName(key)] = value;
    return acc;
  }, {});
}
