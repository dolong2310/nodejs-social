import { IPathService } from '@/application/ports/path.port';

import path from 'path';

export class PathService implements IPathService {
  resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  join(...paths: string[]): string {
    return path.join(...paths);
  }
}
