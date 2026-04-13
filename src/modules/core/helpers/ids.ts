import { v7 as uuidv7 } from 'uuid';

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
