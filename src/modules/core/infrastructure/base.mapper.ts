import { Entity } from '@/modules/core/domain/entities/base.entity';

export interface Mapper<DomainEntity extends Entity<unknown>, DbRecord, Response = unknown> {
  toPersistence(entity: DomainEntity): DbRecord;
  toDomain(record: DbRecord): DomainEntity;
  toResponse(record: DbRecord): Response;
}
