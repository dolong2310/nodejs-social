import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { BadRequestError } from '@/responses/error.response';
import { IFollowUserRequestBody, IUnfollowUserRequestParams } from '@/models/requests/follower.request';
import { OK } from '@/responses/success.response';
import { IFollowersService } from '@/services/followers.service';
import { TokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

export interface IFollowersController {
  followUser(req: Request<{}, {}, IFollowUserRequestBody>, res: Response): Promise<void>;
  unfollowUser(req: Request<IUnfollowUserRequestParams>, res: Response): Promise<void>;
}

class FollowersController extends BaseController implements IFollowersController {
  constructor(private readonly followersService: IFollowersService) {
    super();
  }

  followUser = async (req: Request<{}, {}, IFollowUserRequestBody>, res: Response) => {
    const myUserId = this.getUserId(req);

    const { followedUserId } = req.body;

    // cannot follow yourself
    if (myUserId === followedUserId) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.YOU_CANNOT_FOLLOW_YOURSELF);
    }

    const isFollowing = await this.followersService.findFollowerId({ myUserId, followedUserId });

    if (isFollowing) {
      new OK({
        message: 'Already following user'
      }).send(res);
      return;
    }

    await this.followersService.followUser({ myUserId, followedUserId });

    new OK({
      message: 'Follow user successfully'
    }).send(res);
  };

  unfollowUser = async (req: Request<IUnfollowUserRequestParams>, res: Response) => {
    const myUserId = this.getUserId(req);

    const { userId } = req.params;

    const isFollowing = await this.followersService.findFollowerId({ myUserId, followedUserId: userId });

    if (isFollowing) {
      await this.followersService.unfollowUser({ myUserId, unfollowedUserId: userId });

      new OK({
        message: 'Unfollow user successfully'
      }).send(res);
      return;
    }

    new OK({
      message: 'Not following user'
    }).send(res);
  };
}

export default FollowersController;
