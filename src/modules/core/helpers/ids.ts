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

// import { customAlphabet } from 'nanoid';

// /**
//  * You just increase the length if necessary to improve performance
//  * Attention to the security(id is key)
//  *
//  * Characters	Length	Total   States
//  * UUID	      16	    32	    16^32 = 3.4e+38
//  * Base58	    58	    22	    58^22 = 6.2e+38
//  * ---------------------------------------------------------
//  * Length	    Example	                          Total States
//  * nanoid(8)	re6ZkUUV	                        1.3e+14
//  * nanoid(12)	pfpPYdZGbZvw	                    1.4e+21
//  * nanoid(16)	sFDUZScHfZTfkLwk	                1.6e+28
//  * nanoid(24)	u7vzXJL9cGqUeabGPAZ5XUJ6	        2.1e+42
//  * nanoid(32)	qkvPDeH6JyAsRhaZ3X4ZLDPSLFP7MnJz	2.7e+56
//  *
//  *  See @https://unkey.dev/blog/uuid-ux
//  */
// export const generateId = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');

// export const DEFAULT_PREFIX_ID_LENGTH = 22;
// export const ENTITY_ID_LENGTH = 25;

// export function generatePrefixId(prefix = 'id', length = DEFAULT_PREFIX_ID_LENGTH): string {
//   return `${prefix}_${generateId(length)}`;
// }

// export function generateUserId(length = DEFAULT_PREFIX_ID_LENGTH) {
//   return generatePrefixId('u', length);
// }
