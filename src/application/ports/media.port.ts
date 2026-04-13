import {
  GetStaticVideoStreamPayloadDTO,
  GetVideoStatusByNamePayloadDTO,
  UploadMediaPayloadDTO
} from '@/application/dtos/media/media.payload.dto';
import {
  StaticVideoStreamResultDTO,
  UploadMediaResultDTO,
  VideoStatusResultDTO
} from '@/application/dtos/media/media.result.dto';

export interface IMediaService {
  getStaticVideoStream(payload: GetStaticVideoStreamPayloadDTO): Promise<StaticVideoStreamResultDTO>;
  getVideoStatusByName(payload: GetVideoStatusByNamePayloadDTO): Promise<VideoStatusResultDTO | null>;
  uploadImage(payload: UploadMediaPayloadDTO): Promise<UploadMediaResultDTO[]>;
  uploadVideo(payload: UploadMediaPayloadDTO): Promise<UploadMediaResultDTO[]>;
  uploadVideoHLS(payload: UploadMediaPayloadDTO): Promise<UploadMediaResultDTO[]>;
}
