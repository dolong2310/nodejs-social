import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { ClearCachePort } from '@/modules/operations/application/use-cases/clear-cache/clear-cache.port';

export class ClearCacheUseCase extends ClearCachePort {
  constructor(private readonly cacheManager: CacheManagerPort) {
    super();
  }

  async execute(): Promise<void> {
    await this.cacheManager.clear();
  }
}
