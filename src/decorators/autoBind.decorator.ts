/**
 * AutoBind decorator for class methods.
 *
 * Purpose: ensure `this` is correctly bound to the instance even when the
 * method is passed as a callback (unlike plain prototype methods).
 *
 * No external libraries required.
 */
export function AutoBind(_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

  return {
    configurable: true,
    get() {
      // Bind once per instance, then cache the bound function on the instance.
      const bound = originalMethod.bind(this);

      // Object.defineProperty: lần truy cập sau, JS sẽ không gọi getter nữa mà dùng thẳng hàm đã cache.
      Object.defineProperty(this, propertyKey, {
        configurable: true,
        writable: true,
        value: bound
      });
      return bound;
    }
  };
}
