import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { CreateLikeRequestDTO, DeleteLikeParamsDTO } from '@/dtos/requests/like.request.dto';
import { CreateLikeResponseDTO, DeleteLikeResponseDTO } from '@/dtos/responses/like.response.dto';
import { BadRequestError } from '@/responses/error.response';
import { Created } from '@/responses/success.response';
import { ILikesService } from '@/services/likes.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ILikesController {
  createLike(req: Request<ParamsDictionary, object, CreateLikeRequestDTO>, res: Response): Promise<void>;
  deleteLike(req: Request<DeleteLikeParamsDTO>, res: Response): Promise<void>;
}

class LikesController extends BaseController implements ILikesController {
  constructor(private readonly likesService: ILikesService) {
    super();
  }

  createLike = async (req: Request<ParamsDictionary, object, CreateLikeRequestDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const dto = new CreateLikeRequestDTO(req.body);

    const like = await this.likesService.likePost({
      userId,
      postId: dto.postId
    });

    if (!like) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
    }

    this.sendResponse<CreateLikeResponseDTO>({
      res,
      instance: Created,
      data: like,
      message: 'Post liked successfully'
    });
  };

  deleteLike = async (req: Request<DeleteLikeParamsDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { postId } = req.params;

    await this.likesService.unlikePost({
      userId,
      postId
    });

    this.sendResponse<DeleteLikeResponseDTO>({
      res,
      message: 'Like removed successfully'
    });
  };
}

export default LikesController;
