import type { RepositoryPort } from '@/modules/core/domain-base/repositories/repository.port';
import type { UserEntity } from '@/modules/user/domain/entities/user.entity';

export interface IUserRepository extends RepositoryPort<UserEntity> {}
