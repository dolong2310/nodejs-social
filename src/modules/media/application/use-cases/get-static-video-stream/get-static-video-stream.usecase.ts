import { RANGE_HEADER_REGEX } from '@/modules/common/constants/regex.constants';
import { RequestedRangeNotSatisfiableException } from '@/modules/media/application/exceptions/media.exception';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import {
  GetStaticVideoStreamPort,
  GetStaticVideoStreamInputPort,
  GetStaticVideoStreamOutputPort
} from '@/modules/media/application/use-cases/get-static-video-stream/get-static-video-stream.port';
import path from 'path';

export class GetStaticVideoStreamUseCase extends GetStaticVideoStreamPort {
  constructor(private readonly fileStorage: FileStoragePort) {
    super();
  }

  async execute(input: GetStaticVideoStreamInputPort): Promise<GetStaticVideoStreamOutputPort> {
    const { filename, rangeHeader } = input;
    if (!rangeHeader) {
      throw new RequestedRangeNotSatisfiableException();
    }

    const videoPath = path.resolve('uploads/videos', filename);
    const { size: videoSize } = await this.fileStorage.stat(videoPath);

    const match = RANGE_HEADER_REGEX.exec(rangeHeader);
    if (!match) throw new RequestedRangeNotSatisfiableException();

    const start = Number(match[1]);
    const endFromHeader = match[2] ? Number(match[2]) : null;

    if (!Number.isFinite(start) || start < 0 || start >= videoSize) {
      throw new RequestedRangeNotSatisfiableException();
    }

    const chunkSize = 10 ** 6;
    const end =
      endFromHeader !== null && Number.isFinite(endFromHeader)
        ? Math.min(endFromHeader, videoSize - 1)
        : Math.min(start + chunkSize - 1, videoSize - 1);

    return new GetStaticVideoStreamOutputPort({
      videoPath,
      videoSize,
      start,
      end,
      contentLength: end - start + 1,
      contentType: this.fileStorage.getMimeType(videoPath)
    });
  }
}
