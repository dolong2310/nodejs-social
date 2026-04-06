import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import { CreateLikeRequestDTO, DeleteLikeParamsDTO } from '@/modules/likes/dtos/likes.request.dto';
import { CreateLikeResponseDTO, DeleteLikeResponseDTO } from '@/modules/likes/dtos/likes.response.dto';
import { LikesService } from '@/modules/likes/likes.service';
import { Created } from '@/providers/httpResponses/success.response';
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

  @AutoBind()
  async createLike(req: Request<ParamsDictionary, object, CreateLikeRequestDTO>, res: Response) {
    const userId = this.getUserId(req);
    const dto = new CreateLikeRequestDTO(req.body);

    const like = await this.likesService.likePost({
      userId,
      postId: dto.postId
    });

    this.sendResponse<CreateLikeResponseDTO>({
      res,
      instance: Created,
      data: like,
      message: 'Post liked successfully'
    });
  }

  @AutoBind()
  async deleteLike(req: Request<DeleteLikeParamsDTO>, res: Response) {
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
  }
}
