import { ILikeRepository } from '@/domain/repositories/like/like.repository';

import { CreateLikePayloadDTO, DeleteLikePayloadDTO } from '@/application/dtos/like/like.payload.dto';
import { CreateLikeResultDTO, DeleteLikeResultDTO } from '@/application/dtos/like/like.result.dto';
import { LikePostNotFoundException } from '@/application/errors/like.error';
import { ILikesService } from '@/application/ports/like.port';
import { BaseService } from '@/application/use-cases/base.service';

export class LikesService extends BaseService implements ILikesService {
  constructor(private readonly likeRepository: ILikeRepository) {
    super();
  }

  async likePost({ userId, postId }: CreateLikePayloadDTO): Promise<CreateLikeResultDTO> {
    const result = await this.likeRepository.createLike({ userId, postId });
    if (!result) {
      throw LikePostNotFoundException;
    }
    return new CreateLikeResultDTO(result);
  }

  async unlikePost({ userId, postId }: DeleteLikePayloadDTO): Promise<DeleteLikeResultDTO> {
    const result = await this.likeRepository.deleteLike({ userId, postId });
    if (!result) {
      throw LikePostNotFoundException;
    }
    return new DeleteLikeResultDTO(result);
  }
}
