import { Injectable } from '@/decorators';
import {
  BaseService,
  CreateLikeRequestDTO,
  CreateLikeResponseDTO,
  DeleteLikeParamsDTO,
  DeleteLikeResponseDTO,
  LikeRepository
} from '@/modules';

export interface ILikesService {
  likePost(payload: CreateLikeRequestDTO & { userId: string }): Promise<CreateLikeResponseDTO | null>;
  unlikePost(payload: DeleteLikeParamsDTO & { userId: string }): Promise<DeleteLikeResponseDTO | null>;
}

@Injectable()
export class LikesService extends BaseService implements ILikesService {
  constructor(private readonly likeRepository: LikeRepository) {
    super();
  }

  async likePost({ userId, postId }: CreateLikeRequestDTO & { userId: string }): Promise<CreateLikeResponseDTO | null> {
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
