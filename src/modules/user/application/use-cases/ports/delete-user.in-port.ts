import type { UseCase } from '@/modules/core/application-base/use-cases.port.base';
import type { UserEntity } from '@/modules/user/domain/entities/user.entity';

export interface DeleteUserCommand {
  orderId: string;
}

export abstract class DeleteUserInPort implements UseCase<DeleteUserCommand, UserEntity> {
  abstract execute(deleteUserCommand: DeleteUserCommand): Promise<UserEntity>;
}
