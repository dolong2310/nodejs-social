import { SEED_ERROR_MESSAGE } from '@/constants/message.constant';
import { LoggerInstance } from '@/providers/logger/instance.logger';
import { QueueService } from '@/providers/queue/queue.service';
import type { RedisOptions } from 'ioredis';

const log = LoggerInstance.getLogger().child({ module: 'queue' });

export class QueueInstance {
  private static instance: QueueService | null = null;

  static init(redisOptions: RedisOptions) {
    if (this.instance) return this.instance;
    this.instance = new QueueService(redisOptions);
    return this.instance;
  }

  static get() {
    if (!this.instance) {
      log.error(SEED_ERROR_MESSAGE.QUEUE_INSTANCE_NOT_INITIALIZED);
      throw new Error(SEED_ERROR_MESSAGE.QUEUE_INSTANCE_NOT_INITIALIZED);
    }
    return this.instance;
  }
}
