import type { CreateUserInPort } from '@/modules/user/application/use-cases/ports/create-user.in-port';
import type { LoginEmailPasswordInPort } from '@/modules/user/application/use-cases/ports/login-email-password.in-port';
import type { CreateUserDto } from '@/modules/user/presentation/dtos/create-user.dto';
import type { LoginEmailPasswordDTO } from '@/modules/user/presentation/dtos/login.dto';

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserInPort,
    private readonly loginEmailPasswordUseCase: LoginEmailPasswordInPort
  ) {}

  createUser(body: CreateUserDto) {
    return this.createUserUseCase.execute(body);
  }

  loginEmailPassword(body: LoginEmailPasswordDTO) {
    return this.loginEmailPasswordUseCase.execute(body);
  }
}
