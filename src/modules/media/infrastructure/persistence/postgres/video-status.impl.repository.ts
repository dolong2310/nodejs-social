import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { VideoStatusEntity } from '@/modules/media/domain/entities/video-status.entity';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { IUpdateVideoStatusInput } from '@/modules/media/domain/repositories/video-status.repository.type';
import { VideoStatusMapper } from '@/modules/media/infrastructure/persistence/postgres/video-status.mapper';
import { VideoStatusModel } from '@/modules/media/infrastructure/persistence/postgres/video-status.model';
import type { Pool } from 'pg';

export class VideoStatusRepository
  extends PostgresRepositoryBase<VideoStatusEntity, VideoStatusModel>
  implements VideoStatusRepositoryPort
{
  protected tableName = 'video_status';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: VideoStatusMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async updateVideoStatus(data: IUpdateVideoStatusInput): Promise<boolean> {
    const result = await this.query(
      `
        UPDATE video_status
        SET status = $2, message = $3, updated_at = NOW()
        WHERE name = $1
      `,
      [data.name, data.status, data.message ?? '']
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findVideoStatusByName(name: string): Promise<VideoStatusEntity | null> {
    const result = await this.query<VideoStatusModel>(`SELECT * FROM video_status WHERE name = $1 LIMIT 1`, [name]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }
}
