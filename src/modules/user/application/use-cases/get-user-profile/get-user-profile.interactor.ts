import { CannotViewUserProfileBlockedException, UserNotFoundException } from '@/modules/user/application/user.exception';
import { IBlockService } from '@/modules/block/application/services/block.service';
import { IUserService } from '@/modules/user/application/services/user.service';
import {
  GetUserProfileInPort,
  GetUserProfileQuery,
  GetUserProfileResult
} from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.in-port';

export class GetUserProfileInteractor extends GetUserProfileInPort {
  constructor(
    private readonly userService: IUserService,
    private readonly blockService: IBlockService
  ) {
    super();
  }

  async execute({ userId, username }: GetUserProfileQuery): Promise<GetUserProfileResult> {
    const user = await this.userService.findUserByUsername(username, { querySafe: true });

    if (!user) {
      throw UserNotFoundException;
    }

    if (userId) {
      const blocked = await this.blockService.isBlockedEitherWay(userId, user.id);
      if (blocked) {
        throw CannotViewUserProfileBlockedException;
      }
    }

    return new GetUserProfileResult(user);
  }
}
