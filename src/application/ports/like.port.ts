import { CreateLikePayloadDTO, DeleteLikePayloadDTO } from '@/application/dtos/like/like.payload.dto';
import { CreateLikeResultDTO, DeleteLikeResultDTO } from '@/application/dtos/like/like.result.dto';

export interface ILikesService {
  likePost(payload: CreateLikePayloadDTO): Promise<CreateLikeResultDTO>;
  unlikePost(payload: DeleteLikePayloadDTO): Promise<DeleteLikeResultDTO>;
}
