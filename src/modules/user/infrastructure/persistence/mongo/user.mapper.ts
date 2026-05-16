import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { Username } from '@/modules/common/domain/value-objects/username.value-object';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserFullProps } from '@/modules/user/domain/entities/user.type';
import { type UserModel, userSchema } from '@/modules/user/infrastructure/persistence/mongo/user.model';
import { parse } from 'valibot';

export class UserMapper implements Mapper<UserEntity, UserModel, UserFullProps> {
  toPersistence(entity: UserEntity): UserModel {
    const clone = entity.getProps();
    const record: UserModel = {
      _id: clone.id.toString(),
      name: clone.name,
      email: clone.email.value,
      password: clone.password,
      birthday: clone.birthday,
      role_id: clone.roleId,
      status: clone.status,
      totp_secret: clone.totpSecret,
      bio: clone.bio,
      location: clone.location,
      website: clone.website,
      username: clone.username?.value,
      avatar: clone.avatar,
      cover_photo: clone.coverPhoto,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(userSchema, record);
  }
  toDomain(record: UserModel): UserEntity {
    const entity = new UserEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        name: record.name,
        email: EmailAddress.create(record.email),
        password: record.password,
        birthday: new Date(record.birthday),
        roleId: record.role_id,
        status: record.status,
        totpSecret: record.totp_secret,
        bio: record.bio,
        location: record.location,
        website: record.website,
        username: Username.createOptional(record.username),
        avatar: record.avatar,
        coverPhoto: record.cover_photo
      }
    });
    return entity;
  }
  toResponse(record: UserModel): UserFullProps {
    const response = {
      id: record._id,
      name: record.name,
      email: record.email,
      password: record.password,
      birthday: record.birthday,
      roleId: record.role_id,
      status: record.status,
      totpSecret: record.totp_secret,
      bio: record.bio,
      location: record.location,
      website: record.website,
      username: record.username,
      avatar: record.avatar,
      coverPhoto: record.cover_photo,
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
