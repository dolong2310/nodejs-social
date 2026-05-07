import { OtpEntity } from '@/modules/auth/domain/entities/otp.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { OtpModel, otpSchema } from '@/modules/auth/infrastructure/postgres/otp.model';
import { parse } from 'valibot';

export class OtpMapper implements Mapper<OtpEntity, OtpModel> {
  toPersistence(entity: OtpEntity): OtpModel {
    const clone = entity.getProps();
    const record: OtpModel = {
      id: clone.id.toString(),
      email: clone.email,
      code: clone.code,
      type: clone.type,
      expires_at: clone.expiresAt,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(otpSchema, record);
  }
  toDomain(record: OtpModel): OtpEntity {
    const entity = new OtpEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        email: record.email,
        code: record.code,
        type: record.type,
        expiresAt: record.expires_at
      }
    });
    return entity;
  }
  toResponse() {}
}
