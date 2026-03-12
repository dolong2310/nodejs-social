import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ErrorWithStatus } from '@/models/error.model';
import { IFollowUserRequestBody, IUnfollowUserRequestParams } from '@/models/requests/follower.request';
import followersService from '@/services/followers.service';
import { AccessTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class FollowersController {
  constructor() {}

  getFollowers(req: Request, res: Response) {}

  getFollowing(req: Request, res: Response) {}

  async followUser(req: Request<{}, {}, IFollowUserRequestBody>, res: Response) {
    const { userId: myUserId } = req.accessTokenPayload as AccessTokenPayload;

    const { followedUserId } = req.body;

    // cannot follow yourself
    if (myUserId === followedUserId) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.YOU_CANNOT_FOLLOW_YOURSELF,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    const isFollowing = await followersService.findFollower({ myUserId, followedUserId });

    if (isFollowing) {
      return res.status(HTTP_STATUS.OK).json({
        message: 'Already following user'
      });
    }

    await followersService.followUser({ myUserId, followedUserId });

    return res.status(HTTP_STATUS.OK).json({
      message: 'Follow user successfully'
    });
  }

  async unfollowUser(req: Request<IUnfollowUserRequestParams>, res: Response) {
    const { userId: myUserId } = req.accessTokenPayload as AccessTokenPayload;

    const { userId } = req.params;

    const isFollowing = await followersService.findFollower({ myUserId, followedUserId: userId });

    if (isFollowing) {
      await followersService.unfollowUser({ myUserId, unfollowedUserId: userId });

      return res.status(HTTP_STATUS.OK).json({
        message: 'Unfollow user successfully'
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Not following user'
    });
  }
}

export default new FollowersController();
