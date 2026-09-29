import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { GetMePort, GetMeInputPort, GetMeOutputPort } from '@/modules/user/application/use-cases/get-me/get-me.port';

export class GetMeUseCase extends GetMePort {
  constructor(private readonly userService: UserServicePort) {
    super();
  }

  async execute(input: GetMeInputPort): Promise<GetMeOutputPort> {
    const user = await this.userService.findUserById(input.userId, { querySafe: true });
    if (!user) {
      throw new UserNotFoundException();
    }
    return new GetMeOutputPort(user);
  }
}
