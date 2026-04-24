import { CreateLikeInPort } from '@/application/use-cases/like/like-post/like-post.in-port';
import { UnlikeInPort } from '@/application/use-cases/like/unlike-post/unlike-post.in-port';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { CreateLikeRequestDTO, DeleteLikeParamsDTO } from '@/presentation/http/dtos/like/like.request.dto';
import { CreateLikeResponseDTO, DeleteLikeResponseDTO } from '@/presentation/http/dtos/like/like.response.dto';
import { Created } from '@/presentation/http/responses/success.response';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ILikeController {
  createLike(req: Request<ParamsDictionary, object, CreateLikeRequestDTO>, res: Response): Promise<void>;
  deleteLike(req: Request<DeleteLikeParamsDTO>, res: Response): Promise<void>;
}

export class LikeController extends BaseController implements ILikeController {
  constructor(
    private readonly createLikeUC: CreateLikeInPort,
    private readonly unlikeUC: UnlikeInPort
  ) {
    super();
  }

  @AutoBind()
  async createLike(req: Request<ParamsDictionary, object, CreateLikeRequestDTO>, res: Response) {
    const userId = this.getUserId(req);
    const dto = new CreateLikeRequestDTO(req.body);

    const like = await this.createLikeUC.execute({
      userId,
      postId: dto.postId
    });

    this.sendResponse<CreateLikeResponseDTO>({
      res,
      instance: Created,
      data: new CreateLikeResponseDTO(like),
      message: 'Post liked successfully'
    });
  }

  @AutoBind()
  async deleteLike(req: Request<DeleteLikeParamsDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { postId } = req.params;

    const like = await this.unlikeUC.execute({
      userId,
      postId
    });

    this.sendResponse<DeleteLikeResponseDTO>({
      res,
      data: new DeleteLikeResponseDTO(like),
      message: 'Like removed successfully'
    });
  }
}
