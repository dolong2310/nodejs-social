import { CreateLikeInPort } from '@/modules/like/application/use-cases/like-post/like-post.in-port';
import { UnlikeInPort } from '@/modules/like/application/use-cases/unlike-post/unlike-post.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { CreateLikeRequestDTO, DeleteLikeParamsDTO } from '@/presentation/http/express/v1/dtos/like/like.request.dto';
import {
  CreateLikeResponseDTO,
  DeleteLikeResponseDTO
} from '@/presentation/http/express/v1/dtos/like/like.response.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ILikeController {
  createLike(req: Request<ParamsDictionary, object, CreateLikeRequestDTO>): Promise<unknown>;
  deleteLike(req: Request<DeleteLikeParamsDTO>): Promise<unknown>;
}

export class LikeController extends BaseController implements ILikeController {
  constructor(
    private readonly createLikeUC: CreateLikeInPort,
    private readonly unlikeUC: UnlikeInPort
  ) {
    super();
  }

  @AutoBind()
  async createLike(req: Request<ParamsDictionary, object, CreateLikeRequestDTO>) {
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
  async deleteLike(req: Request<DeleteLikeParamsDTO>) {
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
