interface QueueItem {
  item: string;
  onStart?: () => Promise<void>;
}

/**
 * @deprecated in-memory queue (replaced by BullMQ)
 */
export interface IQueueService {
  enqueue({ item, onStart }: { item: string; onStart?: () => Promise<void> }): void | Promise<void>;
  dequeue(): QueueItem | undefined;
  isEmpty(): boolean;
  isProcessing(): boolean;
  startProcessing<T>({
    task,
    onProcess,
    onSuccess,
    onError
  }: {
    task: (item: string) => Promise<T>;
    onProcess: (item: string) => Promise<void>;
    onSuccess: (item: T) => Promise<void>;
    onError: (error: Error, item: string) => Promise<void>;
  }): Promise<void>;
}

export class QueueService implements IQueueService {
  private items: QueueItem[] = [];
  private processing: boolean = false;
  private onStartWhenEnqueue: boolean = false;

  constructor(options?: { onStartWhenEnqueue?: boolean }) {
    this.onStartWhenEnqueue = options?.onStartWhenEnqueue ?? false;
  }

  enqueue({ item, onStart }: { item: string; onStart?: () => Promise<void> }): void | Promise<void> {
    this.items.push({ item, onStart });
    if (this.onStartWhenEnqueue && onStart) {
      return onStart();
    }
  }

  dequeue(): QueueItem | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  isProcessing(): boolean {
    return this.processing;
  }

  async startProcessing<T>({
    task,
    onProcess,
    onSuccess,
    onError
  }: {
    task: (item: string) => Promise<T>;
    onProcess: (item: string) => Promise<void>;
    onSuccess: (item: T) => Promise<void>;
    onError: (error: Error, item: string) => Promise<void>;
  }): Promise<void> {
    if (this.isProcessing()) {
      return;
    }

    this.processing = true;
    console.log('processing started');

    while (!this.isEmpty()) {
      const queueItem = this.dequeue();
      if (queueItem) {
        const { item, onStart } = queueItem;
        try {
          if (!this.onStartWhenEnqueue && onStart) await onStart();
          await onProcess(item);
          console.log({ item }, 'item processed successfully');
          const result = await task(item);
          await onSuccess(result);
        } catch (error) {
          console.log({ err: error, item }, 'error processing item');
          await onError(error as Error, item).catch((err) => {
            console.log({ err, item }, 'onError handler failed');
          });
        }
      }
    }

    this.processing = false;
    console.log('processing finished');
  }
}
