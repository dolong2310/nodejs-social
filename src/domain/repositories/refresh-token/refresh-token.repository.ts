import { IRefreshToken } from '@/domain/entities/refresh-token.entity';
import {
  ICreateRefreshTokenInput,
  IDeleteRefreshTokenInput,
  IFindRefreshTokenInput,
  IRotateRefreshTokenInput
} from '@/domain/repositories/refresh-token/refresh-token.interface';

export interface IRefreshTokenRepository {
  findRefreshToken(data: IFindRefreshTokenInput): Promise<IRefreshToken | null>;
  createRefreshToken(data: ICreateRefreshTokenInput): Promise<IRefreshToken>;
  deleteRefreshToken(data: IDeleteRefreshTokenInput): Promise<boolean>;
  rotateRefreshToken(data: IRotateRefreshTokenInput): Promise<boolean>;
}
