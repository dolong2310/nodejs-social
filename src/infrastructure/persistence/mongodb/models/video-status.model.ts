import { IVideoStatus } from '@/domain/entities/video-status.entity';
import { ObjectId } from 'mongodb';

export interface IVideoStatusModel extends Omit<IVideoStatus, 'id'> {
  _id?: ObjectId;
}
