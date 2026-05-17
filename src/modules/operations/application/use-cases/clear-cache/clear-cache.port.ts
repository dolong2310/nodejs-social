import { UseCase } from '@/modules/core/application/base.usecase';

export abstract class ClearCachePort implements UseCase<void, void> {
  abstract execute(): Promise<void>;
}
