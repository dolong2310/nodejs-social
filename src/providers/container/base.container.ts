import { Constructor } from '@/interfaces/types/constructor.type';

export abstract class BaseContainer {
  private readonly diInstances = new Map<Constructor, unknown>();

  protected bind<T>(target: Constructor<T>, instance: T): void {
    this.diInstances.set(target, instance);
  }

  private findExistingInstance<T>(target: Constructor<T>): T | null {
    const TargetClass = target as Constructor<T>;
    const values = Object.values(this as Record<string, unknown>);

    for (const value of values) {
      if (value instanceof TargetClass) {
        return value as T;
      }
    }

    return null;
  }

  protected resolve<T>(target: Constructor<T>): T {
    if (this.diInstances.has(target)) {
      return this.diInstances.get(target) as T;
    }

    // Bind instance if it already exists
    const existingInstance = this.findExistingInstance(target);
    if (existingInstance) {
      this.diInstances.set(target, existingInstance);
      return existingInstance;
    }

    const paramTypes: Constructor[] = Reflect.getMetadata('design:paramtypes', target) || [];
    const dependencies = paramTypes.map((dependency) => this.resolve(dependency));
    const TargetClass = target as Constructor<T>;
    const instance = new TargetClass(...dependencies);
    this.diInstances.set(target, instance);
    return instance;
  }
}
