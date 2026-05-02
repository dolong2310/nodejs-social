import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { CreateUserCommand, CreateUserInPort } from '@/modules/user/application/use-cases/ports/create-user.in-port';
import { CreateUserOutPort } from '@/modules/user/application/use-cases/ports/create-user.out-port';

export class CreateUserInteractor implements CreateUserInPort {
  constructor(private readonly createUserPort: CreateUserOutPort) {}

  execute(command: CreateUserCommand): Promise<UserEntity> {
    const user = UserEntity.create(command);
    return this.createUserPort.insert(user);
  }
}
