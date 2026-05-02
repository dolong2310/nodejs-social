import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { OtpEntity } from '@/modules/auth/domain/entities/otp.entity';
import { OtpModel, otpSchema } from '@/modules/auth/domain/repositories/otp.model';
import { parse } from 'valibot';

export class OtpMapper implements Mapper<OtpEntity, OtpModel> {
  toPersistence(entity: OtpEntity): OtpModel {
    const clone = entity.getProps();
    const record: OtpModel = {
      _id: clone.id.toString(),
      email: clone.email,
      code: clone.code,
      type: clone.type,
      expiresAt: clone.expiresAt,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(otpSchema, record);
  }
  toDomain(record: OtpModel): OtpEntity {
    const entity = new OtpEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        email: record.email,
        code: record.code,
        type: record.type,
        expiresAt: record.expiresAt
      }
    });
    return entity;
  }
  toResponse() {}
}
