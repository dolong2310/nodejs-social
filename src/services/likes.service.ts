import { CreateLikeRequestDTO, DeleteLikeParamsDTO } from '@/dtos/requests/like.request.dto';
import { CreateLikeResponseDTO, DeleteLikeResponseDTO } from '@/dtos/responses/like.response.dto';
import { ILikeRepository } from '@/repositories/like.repository';
import { BaseService } from '@/services/base.service';

export interface ILikesService {
  likePost(payload: CreateLikeRequestDTO & { userId: string }): Promise<CreateLikeResponseDTO | null>;
  unlikePost(payload: DeleteLikeParamsDTO & { userId: string }): Promise<DeleteLikeResponseDTO | null>;
}

class LikesService extends BaseService implements ILikesService {
  constructor(private readonly likeRepository: ILikeRepository) {
    super();
  }

  async likePost({
    userId,
    postId
  }: CreateLikeRequestDTO & { userId: string }): Promise<CreateLikeResponseDTO | null> {
    const result = await this.likeRepository.findOneAndUpdate({ userId, postId });
    return result ? new CreateLikeResponseDTO(result) : null;
  }

  async unlikePost({
    userId,
    postId
  }: DeleteLikeParamsDTO & { userId: string }): Promise<DeleteLikeResponseDTO | null> {
    const result = await this.likeRepository.findOneAndDelete({ userId, postId });
    return result ? new DeleteLikeResponseDTO(result) : null;
  }
}

export default LikesService;
