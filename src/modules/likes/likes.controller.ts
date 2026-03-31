import { Injectable } from '@/decorators';
import {
  BaseController,
  CreateLikeRequestDTO,
  CreateLikeResponseDTO,
  DeleteLikeParamsDTO,
  DeleteLikeResponseDTO,
  LikePostNotFoundException,
  LikesService
} from '@/modules';
import { Created } from '@/providers';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ILikesController {
  createLike(req: Request<ParamsDictionary, object, CreateLikeRequestDTO>, res: Response): Promise<void>;
  deleteLike(req: Request<DeleteLikeParamsDTO>, res: Response): Promise<void>;
}

@Injectable()
export class LikesController extends BaseController implements ILikesController {
  constructor(private readonly likesService: LikesService) {
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
      throw LikePostNotFoundException;
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
