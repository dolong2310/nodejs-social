import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserFullProps } from '@/modules/user/domain/entities/user.type';
import { type UserModel, userSchema } from '@/modules/user/infrastructure/mongo/user.model';
import { parse } from 'valibot';

export class UserMapper implements Mapper<UserEntity, UserModel, UserFullProps> {
  toPersistence(entity: UserEntity): UserModel {
    const clone = entity.getProps();
    const record: UserModel = {
      _id: clone.id.toString(),
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
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        name: record.name,
        email: record.email,
        password: record.password,
        birthday: new Date(record.birthday),
        roleId: record.role_id,
        status: record.status,
        totpSecret: record.totp_secret,
        bio: record.bio,
        location: record.location,
        website: record.website,
        username: record.username,
        avatar: record.avatar,
        coverPhoto: record.cover_photo
      }
    });
    return entity;
  }
  toResponse(record: UserModel): UserFullProps {
    return {
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
      updatedAt: record.updated_at
    };
  }
}
