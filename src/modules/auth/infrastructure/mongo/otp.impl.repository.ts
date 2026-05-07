import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { OtpEntity } from '@/modules/auth/domain/entities/otp.entity';
import { EOtpType } from '@/modules/auth/domain/entities/otp.type';
import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';
import { ICreateOtpInput } from '@/modules/auth/domain/repositories/otp.repository.type';
import { OtpMapper } from '@/modules/auth/infrastructure/mongo/otp.mapper';
import { OtpModel } from '@/modules/auth/infrastructure/mongo/otp.model';
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
      { email: record.email, type: record.type },
      {
        $set: {
          code: record.code,
          expires_at: record.expires_at,
          updated_at: record.updated_at
        },
        $setOnInsert: {
          _id: record._id,
          email: record.email,
          type: record.type,
          created_at: record.created_at
        }
      },
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
