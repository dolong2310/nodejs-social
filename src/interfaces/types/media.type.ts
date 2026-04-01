import { EMediaType } from '@/modules/media/media.enum';

export interface IMedia {
  url: string;
  type: EMediaType;
}

export interface IVideoHLSJobData {
  filepath: string; // Absolute path of the uploaded video file on disk
  idName: string; // Unique name/ID used for status tracking in DB
}
