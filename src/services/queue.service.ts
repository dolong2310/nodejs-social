interface QueueItem {
  item: string;
  onStart?: () => Promise<void>;
}

class QueueService {
  private items: QueueItem[] = [];
  private processing: boolean = false;
  private onStartWhenEnqueue: boolean = false;

  constructor(options?: { onStartWhenEnqueue?: boolean }) {
    this.onStartWhenEnqueue = options?.onStartWhenEnqueue ?? false;
  }

  enqueue(item: string, onStart?: () => Promise<void>): void | Promise<void> {
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

  async startProcessing<T>(
    task: (item: string) => Promise<T>,
    onProcess: (item: string) => Promise<void>,
    onSuccess: (item: T) => Promise<void>,
    onError: (error: Error, item: string) => Promise<void>
  ): Promise<void> {
    if (this.isProcessing()) {
      return;
    }

    this.processing = true;
    console.log('\x1b[32m%s\x1b[0m', 'Processing started');

    while (!this.isEmpty()) {
      const queueItem = this.dequeue();
      if (queueItem) {
        const { item, onStart } = queueItem;
        try {
          if (!this.onStartWhenEnqueue && onStart) await onStart();
          await onProcess(item);
          console.log('\x1b[32m%s\x1b[0m', 'Item processed successfully: ', item);
          const result = await task(item);
          await onSuccess(result);
        } catch (error) {
          console.error('Error processing item: ', error);
          await onError(error as Error, item).catch((error) => {
            console.error('DB Error processing item: ', error);
          });
        }
      }
    }

    this.processing = false;
    console.log('\x1b[32m%s\x1b[0m', 'Processing finished');
  }
}

export default QueueService;
