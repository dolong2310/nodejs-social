import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { FollowUserRequestDTO, UnfollowUserParamsDTO } from '@/dtos/requests/follower.request.dto';
import { FollowUserResponseDTO, UnfollowUserResponseDTO } from '@/dtos/responses/follower.response.dto';
import { BadRequestError } from '@/responses/error.response';
import { IFollowersService } from '@/services/followers.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IFollowersController {
  followUser(req: Request<ParamsDictionary, object, FollowUserRequestDTO>, res: Response): Promise<void>;
  unfollowUser(req: Request<UnfollowUserParamsDTO>, res: Response): Promise<void>;
}

class FollowersController extends BaseController implements IFollowersController {
  constructor(private readonly followersService: IFollowersService) {
    super();
  }

  followUser = async (req: Request<ParamsDictionary, object, FollowUserRequestDTO>, res: Response) => {
    const myUserId = this.getUserId(req);
    const dto = new FollowUserRequestDTO(req.body);

    if (myUserId === dto.userId) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.YOU_CANNOT_FOLLOW_YOURSELF);
    }

    const isFollowing = await this.followersService.findFollowerId({ myUserId, userId: dto.userId });

    if (isFollowing) {
      this.sendResponse<FollowUserResponseDTO>({
        res,
        message: 'Already following user'
      });
      return;
    }

    await this.followersService.followUser({ myUserId, userId: dto.userId });

    this.sendResponse<FollowUserResponseDTO>({
      res,
      message: 'Follow user successfully'
    });
  };

  unfollowUser = async (req: Request<UnfollowUserParamsDTO>, res: Response) => {
    const myUserId = this.getUserId(req);
    const { userId } = req.params;

    const isFollowing = await this.followersService.findFollowerId({ myUserId, userId });

    if (isFollowing) {
      await this.followersService.unfollowUser({ myUserId, userId });

      this.sendResponse<UnfollowUserResponseDTO>({
        res,
        message: 'Unfollow user successfully'
      });
      return;
    }

    this.sendResponse<UnfollowUserResponseDTO>({
      res,
      message: 'Not following user'
    });
  };
}

export default FollowersController;
