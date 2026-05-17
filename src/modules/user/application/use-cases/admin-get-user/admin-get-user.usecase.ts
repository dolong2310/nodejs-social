import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import {
  AdminGetUserPort,
  AdminGetUserQuery,
  AdminGetUserResult
} from '@/modules/user/application/use-cases/admin-get-user/admin-get-user.port';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class AdminGetUserUseCase extends AdminGetUserPort {
  constructor(private readonly userRepository: UserRepositoryPort) {
    super();
  }

  async execute(query: AdminGetUserQuery): Promise<AdminGetUserResult> {
    const user = await this.userRepository.findUserById(query.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    return new AdminGetUserResult(this.toSafeUser(user.toObject()));
  }

  private toSafeUser(user: ReturnType<UserEntity['toObject']>): UserSafeProps {
    const { password, totpSecret, ...safe } = user;
    void password;
    void totpSecret;
    return safe;
  }
}
