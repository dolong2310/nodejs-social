import { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import { OtpFullProps } from '@/modules/authentication/domain/entities/otp.type';
import { OtpCode } from '@/modules/authentication/domain/value-objects/otp-code.value-object';
import { OtpModel, otpSchema } from '@/modules/authentication/infrastructure/persistence/postgres/otp.model';
import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class OtpMapper implements Mapper<OtpEntity, OtpModel, OtpFullProps> {
  toPersistence(entity: OtpEntity): OtpModel {
    const clone = entity.getProps();
    const record: OtpModel = {
      id: clone.id.toString(),
      email: clone.email.value,
      code: clone.code.value,
      type: clone.type,
      expires_at: clone.expiresAt,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(otpSchema, record);
  }
  toDomain(record: OtpModel): OtpEntity {
    const entity = new OtpEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        email: EmailAddress.create(record.email),
        code: OtpCode.create(record.code),
        type: record.type,
        expiresAt: record.expires_at
      }
    });
    return entity;
  }
  toResponse(record: OtpModel): OtpFullProps {
    const response = {
      id: record.id,
      email: record.email,
      code: record.code,
      type: record.type,
      expiresAt: record.expires_at,
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null
    };
    return response;
  }
}
