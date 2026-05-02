import type { RepositoryPort } from '@/modules/core/domain-base/repositories/repository.port';
import type { UserEntity } from '@/modules/user/domain/entities/user.entity';

export interface UserRepositoryPort extends RepositoryPort<UserEntity> {}
