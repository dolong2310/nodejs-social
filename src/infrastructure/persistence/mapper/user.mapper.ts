import { UserEntity } from '@/domain/entities/user.entity';
import { IUserModel } from '@/infrastructure/persistence/mongodb/models/user.model';
import { ObjectId } from 'mongodb';

export class UserMapper {
  toPersistence(entity: Partial<UserEntity>): IUserModel {
    const clone = entity;
    const record: IUserModel = {
      _id: new ObjectId(clone.id),
      name: clone.name ?? '',
      email: clone.email ?? '',
      password: clone.password ?? '',
      dateOfBirth: clone.dateOfBirth ?? new Date(),
      verificationStatus: clone.verificationStatus,
      emailVerificationToken: clone.emailVerificationToken,
      forgotPasswordToken: clone.forgotPasswordToken,
      bio: clone.bio,
      location: clone.location,
      website: clone.website,
      username: clone.username,
      avatar: clone.avatar,
      coverPhoto: clone.coverPhoto,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return record;
  }
  toDomain(record: IUserModel): UserEntity {
    const entity = UserEntity.create({
      id: record._id?.toString() ?? '',
      name: record.name,
      email: record.email,
      password: record.password,
      dateOfBirth: record.dateOfBirth,
      verificationStatus: record.verificationStatus,
      emailVerificationToken: record.emailVerificationToken,
      forgotPasswordToken: record.forgotPasswordToken,
      bio: record.bio,
      location: record.location,
      website: record.website,
      username: record.username,
      avatar: record.avatar,
      coverPhoto: record.coverPhoto,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
    return entity;
  }
  toResponse() {}
}
