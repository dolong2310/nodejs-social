import { BadRequestError } from '@/providers';

export const QueueItemIsRequiredException = new BadRequestError('Queue item is required');
