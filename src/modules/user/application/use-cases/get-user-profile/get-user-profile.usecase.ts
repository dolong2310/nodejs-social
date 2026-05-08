import { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import {
  CannotViewUserProfileBlockedException,
  UserNotFoundException
} from '@/modules/user/application/exceptions/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import {
  GetUserProfilePort,
  GetUserProfileQuery,
  GetUserProfileResult
} from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.port';

export class GetUserProfileUseCase extends GetUserProfilePort {
  constructor(
    private readonly userService: UserServicePort,
    private readonly blockService: BlockServicePort
  ) {
    super();
  }

  async execute({ userId, username }: GetUserProfileQuery): Promise<GetUserProfileResult> {
    const user = await this.userService.findUserByUsername(username, { querySafe: true });

    if (!user) {
      throw new UserNotFoundException();
    }

    if (userId) {
      const blocked = await this.blockService.isBlockedEitherWay(userId, user.id);
      if (blocked) {
        throw new CannotViewUserProfileBlockedException();
      }
    }

    return new GetUserProfileResult(user);
  }
}
