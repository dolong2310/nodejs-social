/**
 * AutoBind decorator for class methods.
 *
 * Purpose: ensure `this` is correctly bound to the instance even when the
 * method is passed as a callback (unlike plain prototype methods).
 *
 * No external libraries required.
 */
type AutoBindMethod = (...args: unknown[]) => unknown;

function createAutoBindDecorator(
  _target: unknown,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  if (typeof originalMethod !== 'function') {
    return descriptor;
  }

  return {
    configurable: true,
    get() {
      // Bind once per instance, then cache the bound function on the instance.
      const bound = (originalMethod as AutoBindMethod).bind(this);

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

function AutoBind(): MethodDecorator;
function AutoBind(_target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor;
function AutoBind(
  target?: unknown,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor
): MethodDecorator | PropertyDescriptor {
  // Support both syntaxes: @AutoBind and @AutoBind()
  if (propertyKey !== undefined && descriptor !== undefined) {
    return createAutoBindDecorator(target, propertyKey, descriptor);
  }

  return (decoratorTarget: unknown, decoratorPropertyKey: string | symbol, decoratorDescriptor: PropertyDescriptor) =>
    createAutoBindDecorator(decoratorTarget, decoratorPropertyKey, decoratorDescriptor);
}

export { AutoBind };
