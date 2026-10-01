import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import {
  AdminGetUserPort,
  AdminGetUserInputPort,
  AdminGetUserOutputPort
} from '@/modules/user/application/use-cases/admin-get-user/admin-get-user.port';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserSafeProps } from '@/modules/user/domain/entities/user.types';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class AdminGetUserUseCase extends AdminGetUserPort {
  constructor(private readonly userRepository: UserRepositoryPort) {
    super();
  }

  async execute(input: AdminGetUserInputPort): Promise<AdminGetUserOutputPort> {
    const user = await this.userRepository.findUserById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    return new AdminGetUserOutputPort(this.toSafeUser(user.toObject()));
  }

  private toSafeUser(user: ReturnType<UserEntity['toObject']>): UserSafeProps {
    const { password, totpSecret, ...safe } = user;
    void password;
    void totpSecret;
    return safe;
  }
}
