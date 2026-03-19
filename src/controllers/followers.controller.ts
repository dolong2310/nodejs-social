import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { IFollowUserRequestBody, IUnfollowUserRequestParams } from '@/models/requests/follower.request';
import { IFollowUserResponse, IUnfollowUserResponse } from '@/models/responses/follower.response';
import { BadRequestError } from '@/responses/error.response';
import { IFollowersService } from '@/services/followers.service';
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

    const { userId: followedUserId } = req.body;

    // cannot follow yourself
    if (myUserId === followedUserId) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.YOU_CANNOT_FOLLOW_YOURSELF);
    }

    const isFollowing = await this.followersService.findFollowerId({ myUserId, userId: followedUserId });

    if (isFollowing) {
      this.sendResponse<IFollowUserResponse>({
        res,
        message: 'Already following user'
      });
      return;
    }

    await this.followersService.followUser({ myUserId, userId: followedUserId });

    this.sendResponse<IFollowUserResponse>({
      res,
      message: 'Follow user successfully'
    });
  };

  unfollowUser = async (req: Request<IUnfollowUserRequestParams>, res: Response) => {
    const myUserId = this.getUserId(req);

    const { userId } = req.params;

    const isFollowing = await this.followersService.findFollowerId({ myUserId, userId });

    if (isFollowing) {
      await this.followersService.unfollowUser({ myUserId, userId });

      this.sendResponse<IUnfollowUserResponse>({
        res,
        message: 'Unfollow user successfully'
      });
      return;
    }

    this.sendResponse<IUnfollowUserResponse>({
      res,
      message: 'Not following user'
    });
  };
}

export default FollowersController;
