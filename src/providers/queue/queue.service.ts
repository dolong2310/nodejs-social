import {
  EmailJobQueue,
  EmailWorker,
  IEmailJobQueue,
  IVideoHLSJobQueue,
  VideoHLSJobQueue,
  VideoHLSWorker
} from '@/providers';
import { LoggerInstance } from '@/providers/logger';
import { type ConnectionOptions, type Worker } from 'bullmq';
import type { RedisOptions } from 'ioredis';

const log = LoggerInstance.getLogger().child({ module: 'queue' });

export interface IQueueService {
  getEmailJobQueue(): IEmailJobQueue;
  getVideoHLSJobQueue(): IVideoHLSJobQueue;
}

export class QueueService implements IQueueService {
  private static instance: QueueService | null = null;

  private readonly emailJobQueue: EmailJobQueue;
  private readonly videoHLSJobQueue: VideoHLSJobQueue;
  private readonly workers: Worker[];

  private constructor(redisOptions: RedisOptions) {
    const connection: ConnectionOptions = {
      ...redisOptions,
      host: redisOptions.host,
      port: redisOptions.port,
      password: redisOptions.password,
      db: redisOptions.db,
      // BullMQ: WARNING! Your redis options maxRetriesPerRequest must be null and enableReadyCheck false' (link ref: https://github.com/taskforcesh/bullmq/commit/09ba358b6f761bdc52b0f5b2aa315cc6c2a9db6e)
      maxRetriesPerRequest: null, // maxRetriesPerRequest: Đặt giá trị null để bỏ giới hạn số lần retry mỗi request, đảm bảo các lỗi kết nối Redis được xử lý bởi worker thay vì ioredis.
      enableReadyCheck: false, // enableReadyCheck: false giúp giảm thời gian khởi động vì bỏ qua bước kiểm tra ready check với Redis (phù hợp môi trường cloud hoặc cluster).
      retryStrategy: (times: number) => Math.min(times * 200, 5000) // retryStrategy: Xác định chiến lược retry khi kết nối thất bại – tăng dần thời gian đợi (times * 200ms), tối đa 5000ms mỗi lần.
    };

    // 1. Initialize queues
    this.emailJobQueue = new EmailJobQueue(connection);
    this.videoHLSJobQueue = new VideoHLSJobQueue(connection);

    // 2. Initialize workers
    this.workers = [new EmailWorker().createWorker(connection), new VideoHLSWorker().createWorker(connection)];

    log.info('queue service initialized');
  }

  static init(redisOptions: RedisOptions): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService(redisOptions);
    }
    return QueueService.instance;
  }

  static get(): QueueService {
    if (!QueueService.instance) {
      throw new Error('QueueService has not been initialized. Call QueueService.init() during bootstrap.');
    }
    return QueueService.instance;
  }

  static async close(): Promise<void> {
    if (!QueueService.instance) return;
    await Promise.allSettled([
      ...QueueService.instance.workers.map((w) => w.close()),
      QueueService.instance.emailJobQueue.close(),
      QueueService.instance.videoHLSJobQueue.close()
    ]);
    QueueService.instance = null;
    log.info('queue service closed');
  }

  static resetInstance(): void {
    QueueService.instance = null;
  }

  getEmailJobQueue(): IEmailJobQueue {
    return this.emailJobQueue;
  }

  getVideoHLSJobQueue(): IVideoHLSJobQueue {
    return this.videoHLSJobQueue;
  }
}
