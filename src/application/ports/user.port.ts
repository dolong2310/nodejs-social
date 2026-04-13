import {
  FindUserByEmailPayloadDTO,
  FindUserByIdPayloadDTO,
  FindUserByUsernamePayloadDTO,
  GetMePayloadDTO,
  GetUserProfilePayloadDTO,
  InvalidateUserCachePayloadDTO,
  UpdateMePayloadDTO
} from '@/application/dtos/user/user.payload.dto';
import { UserResultDTO } from '@/application/dtos/user/user.result.dto';

export interface IUsersService {
  findUserByEmail(payload: FindUserByEmailPayloadDTO): Promise<UserResultDTO | null>;
  findUserById(payload: FindUserByIdPayloadDTO): Promise<UserResultDTO | null>;
  findUserByUsername(payload: FindUserByUsernamePayloadDTO): Promise<UserResultDTO | null>;
  getMe(payload: GetMePayloadDTO): Promise<UserResultDTO>;
  updateMe(payload: UpdateMePayloadDTO): Promise<UserResultDTO>;
  getUserProfile(payload: GetUserProfilePayloadDTO): Promise<UserResultDTO>;
  invalidateUserCache(payload: InvalidateUserCachePayloadDTO): Promise<void>;
}
