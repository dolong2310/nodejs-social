import { Job, Worker, WorkerOptions } from 'bullmq';

export abstract class BaseWorker<TData, TResult, TName extends string = string> {
  protected worker: Worker<TData, TResult, TName>;

  constructor({ name, workerOptions }: { name: TName; workerOptions: WorkerOptions }) {
    this.worker = new Worker<TData, TResult, TName>(name, this.process.bind(this), workerOptions);
  }

  protected abstract process(job: Job<TData, TResult>): Promise<TResult>;
}
