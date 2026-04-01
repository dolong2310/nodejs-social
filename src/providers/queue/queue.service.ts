import { LoggerInstance } from '@/providers/logger/instance.logger';
import { EmailJobQueue } from '@/providers/queue/queues/email.queue';
import { NotificationTrimJobQueue } from '@/providers/queue/queues/notification-trim.queue';
import { PostViewsJobQueue } from '@/providers/queue/queues/post-views.queue';
import { VideoHLSJobQueue } from '@/providers/queue/queues/video-hls.queue';
import { EmailWorker } from '@/providers/queue/workers/email.worker';
import { NotificationTrimWorker } from '@/providers/queue/workers/notification-trim.worker';
import { PostViewsWorker } from '@/providers/queue/workers/post-views.worker';
import { VideoHLSWorker } from '@/providers/queue/workers/video-hls.worker';
import { type ConnectionOptions, type Worker } from 'bullmq';
import type { RedisOptions } from 'ioredis';

const log = LoggerInstance.getLogger().child({ module: 'queue' });

export interface IQueueService {
  connect(): void;
  getEmailJobQueue(): EmailJobQueue;
  getVideoHLSJobQueue(): VideoHLSJobQueue;
  getNotificationTrimJobQueue(): NotificationTrimJobQueue;
  getPostViewsJobQueue(): PostViewsJobQueue;
}

export class QueueService implements IQueueService {
  private static instance: QueueService | null = null;
  private connection: ConnectionOptions;

  private emailJobQueue: EmailJobQueue | null = null;
  private videoHLSJobQueue: VideoHLSJobQueue | null = null;
  private notificationTrimJobQueue: NotificationTrimJobQueue | null = null;
  private postViewsJobQueue: PostViewsJobQueue | null = null;
  private workers: Worker[] | null = null;

  constructor(redisOptions: RedisOptions) {
    this.connection = {
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
  }

  public connect() {
    // 1. Initialize queues
    this.emailJobQueue = new EmailJobQueue(this.connection);
    this.videoHLSJobQueue = new VideoHLSJobQueue(this.connection);
    this.notificationTrimJobQueue = new NotificationTrimJobQueue(this.connection);
    this.postViewsJobQueue = new PostViewsJobQueue(this.connection);

    // 2. Initialize workers
    this.workers = [
      new EmailWorker().createWorker(this.connection),
      new VideoHLSWorker().createWorker(this.connection),
      new NotificationTrimWorker().createWorker(this.connection),
      new PostViewsWorker().createWorker(this.connection)
    ];

    log.info('queue service initialized');
  }

  static async close(): Promise<void> {
    if (!QueueService.instance) return;
    await Promise.allSettled([
      ...QueueService.instance.workers!.map((w) => w.close()),
      QueueService.instance.emailJobQueue!.close(),
      QueueService.instance.videoHLSJobQueue!.close(),
      QueueService.instance.notificationTrimJobQueue!.close(),
      QueueService.instance.postViewsJobQueue!.close()
    ]);
    QueueService.instance = null;
    log.info('queue service closed');
  }

  static resetInstance(): void {
    QueueService.instance = null;
  }

  public getEmailJobQueue(): EmailJobQueue {
    return this.emailJobQueue!;
  }

  public getVideoHLSJobQueue(): VideoHLSJobQueue {
    return this.videoHLSJobQueue!;
  }

  public getNotificationTrimJobQueue(): NotificationTrimJobQueue {
    return this.notificationTrimJobQueue!;
  }

  public getPostViewsJobQueue(): PostViewsJobQueue {
    return this.postViewsJobQueue!;
  }
}
