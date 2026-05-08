import { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import { OtpFullProps } from '@/modules/authentication/domain/entities/otp.type';
import { OtpModel, otpSchema } from '@/modules/authentication/infrastructure/persistence/mongo/otp.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class OtpMapper implements Mapper<OtpEntity, OtpModel, OtpFullProps> {
  toPersistence(entity: OtpEntity): OtpModel {
    const clone = entity.getProps();
    const record: OtpModel = {
      _id: clone.id.toString(),
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
      id: new UniqueEntityID(record._id),
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
  toResponse(record: OtpModel): OtpFullProps {
    return {
      id: record._id,
      email: record.email,
      code: record.code,
      type: record.type,
      expiresAt: record.expires_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
