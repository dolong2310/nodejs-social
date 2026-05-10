import logger from '@/infrastructure/logger/create-logger';
import { Queue, QueueOptions } from 'bullmq';

export abstract class BaseSchedule<TData, TResult, TName extends string = string> {
  private readonly _queue: Queue<TData, TResult, TName>;

  get queue(): Queue<TData, TResult> {
    return this._queue;
  }

  constructor({ name, queueOptions }: { name: TName; queueOptions: QueueOptions }) {
    this._queue = new Queue<TData, TResult, TName>(name, queueOptions);

    this.queue.on('error', (err) => {
      logger.child({ module: name }).error({ err }, `${name} queue schedule error`);
    });
  }

  protected abstract handleCron(): Promise<void>;
  abstract close(): Promise<void>;
}
