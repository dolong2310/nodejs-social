import { UserNotFoundException } from '@/modules/user/application/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { GetMeInPort, GetMeQuery, GetMeResult } from '@/modules/user/application/use-cases/get-me/get-me.in-port';

export class GetMeInteractor extends GetMeInPort {
  constructor(private readonly userService: UserServicePort) {
    super();
  }

  async execute({ userId }: GetMeQuery): Promise<GetMeResult> {
    const user = await this.userService.findUserById(userId, { querySafe: true });
    if (!user) {
      throw new UserNotFoundException();
    }
    return new GetMeResult(user);
  }
}
