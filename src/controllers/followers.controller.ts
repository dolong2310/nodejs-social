import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BadRequestError } from '@/models/error.response';
import { IFollowUserRequestBody, IUnfollowUserRequestParams } from '@/models/requests/follower.request';
import { OK } from '@/models/success.response';
import followersService from '@/services/followers.service';
import { AccessTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class FollowersController {
  constructor() {}

  async followUser(req: Request<{}, {}, IFollowUserRequestBody>, res: Response) {
    const { userId: myUserId } = req.accessTokenPayload as AccessTokenPayload;

    const { followedUserId } = req.body;

    // cannot follow yourself
    if (myUserId === followedUserId) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.YOU_CANNOT_FOLLOW_YOURSELF);
    }

    const isFollowing = await followersService.findFollower({ myUserId, followedUserId });

    if (isFollowing) {
      return new OK({
        message: 'Already following user'
      }).send(res);
    }

    await followersService.followUser({ myUserId, followedUserId });

    return new OK({
      message: 'Follow user successfully'
    }).send(res);
  }

  async unfollowUser(req: Request<IUnfollowUserRequestParams>, res: Response) {
    const { userId: myUserId } = req.accessTokenPayload as AccessTokenPayload;

    const { userId } = req.params;

    const isFollowing = await followersService.findFollower({ myUserId, followedUserId: userId });

    if (isFollowing) {
      await followersService.unfollowUser({ myUserId, unfollowedUserId: userId });

      return new OK({
        message: 'Unfollow user successfully'
      }).send(res);
    }

    return new OK({
      message: 'Not following user'
    }).send(res);
  }
}

export default new FollowersController();
