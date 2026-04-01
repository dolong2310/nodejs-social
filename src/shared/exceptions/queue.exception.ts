import { BadRequestError } from '@/providers/httpResponses/error.response';

export const QueueItemIsRequiredException = new BadRequestError('Queue item is required');
