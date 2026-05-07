import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserFullProps } from '@/modules/user/domain/entities/user.type';
import { type UserModel, userSchema } from '@/modules/user/infrastructure/postgres/user.model';
import { parse } from 'valibot';

export class UserMapper implements Mapper<UserEntity, UserModel, UserFullProps> {
  toPersistence(entity: UserEntity): UserModel {
    const clone = entity.getProps();
    const record: UserModel = {
      id: clone.id.toString(),
      name: clone.name,
      email: clone.email,
      password: clone.password,
      birthday: clone.birthday,
      role_id: clone.roleId,
      status: clone.status,
      totp_secret: clone.totpSecret,
      bio: clone.bio,
      location: clone.location,
      website: clone.website,
      username: clone.username,
      avatar: clone.avatar,
      cover_photo: clone.coverPhoto,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(userSchema, record);
  }
  toDomain(record: UserModel): UserEntity {
    const entity = new UserEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        name: record.name,
        email: record.email,
        password: record.password,
        birthday: new Date(record.birthday),
        roleId: record.role_id,
        status: record.status,
        totpSecret: record.totp_secret ?? undefined,
        bio: record.bio ?? undefined,
        location: record.location ?? undefined,
        website: record.website ?? undefined,
        username: record.username ?? undefined,
        avatar: record.avatar ?? undefined,
        coverPhoto: record.cover_photo ?? undefined
      }
    });
    return entity;
  }
  toResponse(record: UserModel): UserFullProps {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      birthday: record.birthday,
      roleId: record.role_id,
      status: record.status,
      totpSecret: record.totp_secret ?? undefined,
      bio: record.bio ?? undefined,
      location: record.location ?? undefined,
      website: record.website ?? undefined,
      username: record.username ?? undefined,
      avatar: record.avatar ?? undefined,
      coverPhoto: record.cover_photo ?? undefined,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
