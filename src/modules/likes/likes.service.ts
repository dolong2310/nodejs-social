import { Injectable } from '@/decorators/injectable.decorator';
import { BaseService } from '@/modules/base/base.service';
import { CreateLikeRequestDTO, DeleteLikeParamsDTO } from '@/modules/likes/dtos/likes.request.dto';
import { CreateLikeResponseDTO, DeleteLikeResponseDTO } from '@/modules/likes/dtos/likes.response.dto';
import { LikePostNotFoundException } from '@/modules/likes/likes.exception';
import { LikeRepository } from '@/modules/likes/likes.repository';

export interface ILikesService {
  likePost(payload: CreateLikeRequestDTO & { userId: string }): Promise<CreateLikeResponseDTO>;
  unlikePost(payload: DeleteLikeParamsDTO & { userId: string }): Promise<DeleteLikeResponseDTO | null>;
}

@Injectable()
export class LikesService extends BaseService implements ILikesService {
  constructor(private readonly likeRepository: LikeRepository) {
    super();
  }

  async likePost({ userId, postId }: CreateLikeRequestDTO & { userId: string }): Promise<CreateLikeResponseDTO> {
    const result = await this.likeRepository.findOneAndUpdate({ userId, postId });

    if (!result) {
      throw LikePostNotFoundException;
    }

    return new CreateLikeResponseDTO(result);
  }

  async unlikePost({
    userId,
    postId
  }: DeleteLikeParamsDTO & { userId: string }): Promise<DeleteLikeResponseDTO | null> {
    const result = await this.likeRepository.findOneAndDelete({ userId, postId });
    return result ? new DeleteLikeResponseDTO(result) : null;
  }
}
