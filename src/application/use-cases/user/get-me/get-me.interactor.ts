import { UserNotFoundException } from '@/application/exceptions/user.exception';
import { IUserService } from '@/application/services/user/user.service';
import { GetMeInPort, GetMeQuery, GetMeResult } from '@/application/use-cases/user/get-me/get-me.in-port';

export class GetMeInteractor extends GetMeInPort {
  constructor(private readonly userService: IUserService) {
    super();
  }

  async execute({ userId }: GetMeQuery): Promise<GetMeResult> {
    const user = await this.userService.findUserById(userId, { querySafe: true });
    if (!user) {
      throw UserNotFoundException;
    }
    return new GetMeResult(user);
  }
}
