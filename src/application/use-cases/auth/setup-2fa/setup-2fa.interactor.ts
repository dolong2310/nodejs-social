import { UserAlreadyHas2FAException } from '@/application/exceptions/otp.exception';
import { UserNotFoundException } from '@/application/exceptions/user.exception';
import { ITwoFactorAuthenticationService } from '@/application/ports/2fa.port';
import { IUserService } from '@/application/services/user/user.service';
import {
  Setup2FACommand,
  Setup2FAInPort,
  Setup2FAResult
} from '@/application/use-cases/auth/setup-2fa/setup-2fa.in-port';
import { UserEntity } from '@/domain/entities/user/user.entity';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export class Setup2FAInteractor extends Setup2FAInPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: IUserService,
    private readonly twoFactorAuthenticationService: ITwoFactorAuthenticationService
  ) {
    super();
  }

  async execute({ userId }: Setup2FACommand): Promise<Setup2FAResult> {
    // 1. Lấy user từ database, kiểm tra user có tồn tại không và kiểm tra đã enable 2FA chưa
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw UserNotFoundException;
    }

    if (user.totpSecret) {
      throw UserAlreadyHas2FAException;
    }

    // 2. Tạo secret key và URI cho 2FA
    const { secret, uri } = this.twoFactorAuthenticationService.generateSecret(user.email);

    // 3. Lưu secret key vào database
    await this.userRepository.updateOne(userId, { totpSecret: secret } as Partial<UserEntity>);

    // 4. Return secret key và URI
    return new Setup2FAResult({
      secret,
      uri
    });
  }
}
