import { CreateLikePort } from '@/modules/post/application/use-cases/like-post/like-post.port';
import { UnlikePort } from '@/modules/post/application/use-cases/unlike-post/unlike-post.port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { CreateLikeRequestDTO, DeleteLikeParamsDTO } from '@/presentation/http/express/v1/dtos/like/like.request.dto';
import {
  CreateLikeResponseDTO,
  DeleteLikeResponseDTO
} from '@/presentation/http/express/v1/dtos/like/like.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ILikeController {
  createLike(
    req: ExpressRequest<ParamsDictionary, object, CreateLikeRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  deleteLike(req: ExpressRequest<DeleteLikeParamsDTO>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
}

export class LikeController extends BaseController implements ILikeController {
  constructor(
    private readonly createLikeUC: CreateLikePort,
    private readonly unlikeUC: UnlikePort
  ) {
    super();
  }

  @AutoBind()
  async createLike(req: ExpressRequest<ParamsDictionary, object, CreateLikeRequestDTO>) {
    const userId = this.getUserId(req);
    const dto = new CreateLikeRequestDTO(req.body);

    const like = await this.createLikeUC.execute({
      userId,
      postId: dto.postId
    });

    return this.response<CreateLikeResponseDTO>({
      instance: Created,
      data: new CreateLikeResponseDTO(like),
      message: 'Post liked successfully'
    });
  }

  @AutoBind()
  async deleteLike(req: ExpressRequest<DeleteLikeParamsDTO>) {
    const userId = this.getUserId(req);
    const { postId } = req.params;

    const like = await this.unlikeUC.execute({
      userId,
      postId
    });

    return this.response<DeleteLikeResponseDTO>({
      data: new DeleteLikeResponseDTO(like),
      message: 'Like removed successfully'
    });
  }
}
