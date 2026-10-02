import { date, isoTimestamp, pipe, string, toDate, union } from 'valibot';

/**
 * Date field of a response. Accepts a `Date` or an ISO timestamp string, always outputs a `Date`.
 * Use-case outputs read through the Redis cache are JSON round-tripped, so their dates arrive as strings.
 */
export const responseDateSchema = union([date(), pipe(string(), isoTimestamp(), toDate())]);
