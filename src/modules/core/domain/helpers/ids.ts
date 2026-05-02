import { v7 as uuidv7, validate as uuidValidate, version as uuidVersion } from 'uuid';

export const ENTITY_ID_LENGTH = 36; // UUID v7 length (32 hex digits + 4 dashes)

/**
 * UUID v7 generator
 * - Time-ordered => DB index
 * ví dụ: "018f3c9c-8c2a-7b2e-bc1a-9f3e6a1b2c3d"
 */
export function generateId(): string {
  return uuidv7();
}

/**
 * Prefix ID
 * Ví dụ: u_018f3c9c-8c2a-7b2e-bc1a-9f3e6a1b2c3d
 */
export function generatePrefixId(prefix = 'id'): string {
  return `${prefix}_${generateId()}`;
}

export function generateUserId(): string {
  return generatePrefixId('u');
}

export function removePrefix(id: string): string {
  const index = id.indexOf('_');
  return index !== -1 ? id.slice(index + 1) : id;
}

export function isValidId(id: string): boolean {
  const realId = removePrefix(id);
  return uuidValidate(realId) && uuidVersion(realId) === 7;
}
