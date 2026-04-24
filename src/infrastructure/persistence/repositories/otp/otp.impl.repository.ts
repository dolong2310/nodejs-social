import { LoggerPort } from '@/application/ports/logger.port';
import { OtpEntity } from '@/domain/entities/otp/otp.entity';
import { EOtpType } from '@/domain/entities/otp/otp.type';
import { OtpRepositoryPort } from '@/domain/repositories/otp/otp.repository';
import { ICreateOtpInput } from '@/domain/repositories/otp/otp.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { OtpMapper } from '@/infrastructure/persistence/repositories/otp/otp.mapper';
import { OtpModel } from '@/infrastructure/persistence/repositories/otp/otp.model';
import { Db, MongoClient } from 'mongodb';

export class OtpRepository extends MongoRepositoryBase<OtpEntity, OtpModel> implements OtpRepositoryPort {
  protected collectionName = 'otps';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: OtpMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findUniqueOtpCode(data: { email: string; type: EOtpType }): Promise<OtpEntity | null> {
    const record = await this.dbCollection.findOne({
      email: data.email,
      type: data.type
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  async createOtp(data: ICreateOtpInput): Promise<OtpEntity | null> {
    const entity = OtpEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    const result = await this.dbCollection.findOneAndUpdate(
      { email: record.email, code: record.code, type: record.type, expiresAt: record.expiresAt },
      { $setOnInsert: record },
      { upsert: true, returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async deleteOtp(id: string): Promise<OtpEntity | null> {
    const record = await this.dbCollection.findOneAndDelete({
      _id: id
    });
    return record ? this.mapper.toDomain(record) : null;
  }
}
