import type { UseCase } from '@/modules/core/application-base/use-cases.port.base';
import type { UserEntity } from '@/modules/user/domain/entities/user.entity';
import type { CreateUserProps } from '@/modules/user/domain/entities/user.types';

export interface CreateUserCommand extends CreateUserProps {}

export abstract class CreateUserInPort implements UseCase<CreateUserCommand, UserEntity> {
  abstract execute(createUserCommand: CreateUserCommand): Promise<UserEntity>;
}
