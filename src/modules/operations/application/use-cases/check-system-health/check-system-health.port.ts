import type {
  SystemHealthJobData,
  SystemHealthJobResult
} from '@/modules/operations/application/ports/system-health-job.port';

export abstract class CheckSystemHealthPort {
  abstract execute(data?: SystemHealthJobData): Promise<SystemHealthJobResult>;
}
