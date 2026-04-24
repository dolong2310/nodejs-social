import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { UserEntity } from '@/domain/entities/user/user.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import { type UserModel, userSchema } from '@/infrastructure/persistence/repositories/user/user.model';
import { parse } from 'valibot';

export class UserMapper implements Mapper<UserEntity, UserModel> {
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
        birthday: record.birthday,
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
  toResponse() {}
}
