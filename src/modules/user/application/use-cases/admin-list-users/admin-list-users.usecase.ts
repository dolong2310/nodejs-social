import {
  AdminListUsersPort,
  AdminListUsersQuery,
  AdminListUsersResult
} from '@/modules/user/application/use-cases/admin-list-users/admin-list-users.port';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class AdminListUsersUseCase extends AdminListUsersPort {
  constructor(private readonly userRepository: UserRepositoryPort) {
    super();
  }

  async execute(query: AdminListUsersQuery): Promise<AdminListUsersResult> {
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;
    const paginated = await this.userRepository.findAllPaginated({
      page,
      limit,
      offset,
      orderBy: { field: 'createdAt', param: 'desc' }
    });

    return new AdminListUsersResult({
      items: paginated.data.map((user) => this.toSafeUser(user.toObject())),
      total: paginated.count
    });
  }

  private toSafeUser(user: ReturnType<UserEntity['toObject']>): UserSafeProps {
    const { password, totpSecret, ...safe } = user;
    void password;
    void totpSecret;
    return safe;
  }
}
