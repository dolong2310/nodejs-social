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
      roleId: clone.roleId,
      status: clone.status,
      totpSecret: clone.totpSecret,
      bio: clone.bio,
      location: clone.location,
      website: clone.website,
      username: clone.username,
      avatar: clone.avatar,
      coverPhoto: clone.coverPhoto,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(userSchema, record);
  }
  toDomain(record: UserModel): UserEntity {
    const entity = new UserEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        name: record.name,
        email: record.email,
        password: record.password,
        birthday: new Date(record.birthday),
        roleId: record.roleId,
        status: record.status,
        totpSecret: record.totpSecret,
        bio: record.bio,
        location: record.location,
        website: record.website,
        username: record.username,
        avatar: record.avatar,
        coverPhoto: record.coverPhoto
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
      roleId: record.roleId,
      status: record.status,
      totpSecret: record.totpSecret,
      bio: record.bio,
      location: record.location,
      website: record.website,
      username: record.username,
      avatar: record.avatar,
      coverPhoto: record.coverPhoto,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
