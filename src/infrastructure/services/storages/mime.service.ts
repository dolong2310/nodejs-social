import { IMimeService } from '@/application/ports/mime.port';

import mime from 'mime';
import mimeTypes from 'mime-types';

export class MimeService implements IMimeService {
  getType(filepath: string, defaultType?: string): string {
    return mime.getType(filepath) ?? defaultType ?? 'application/octet-stream';
  }

  getContentType(filepath: string, defaultType?: string): string {
    return mimeTypes.lookup(filepath) || defaultType || 'application/octet-stream';
  }
}
