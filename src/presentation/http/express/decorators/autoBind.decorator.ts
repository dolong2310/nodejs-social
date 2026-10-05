/**
 * AutoBind decorator for classes and class methods.
 *
 * - On a method: binds that method only.
 * - On a class: binds every own prototype method (accessors and constructor are skipped).
 *
 * Purpose: ensure `this` is correctly bound to the instance even when the
 * method is passed as a callback (unlike plain prototype methods).
 *
 * No external libraries required.
 */
type AnyClass = abstract new (...args: never[]) => object;
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

      // Object.defineProperty makes later reads use the cached bound function instead of invoking the getter again.
      Object.defineProperty(this, propertyKey, {
        configurable: true,
        writable: true,
        value: bound
      });
      return bound;
    }
  };
}

function autoBindClass(target: AnyClass): void {
  const prototype = target.prototype as object;

  for (const key of Reflect.ownKeys(prototype)) {
    if (key === 'constructor') continue;

    const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
    // Skips accessors and methods already decorated at method level (they have no `value`).
    if (!descriptor || typeof descriptor.value !== 'function') continue;

    Object.defineProperty(prototype, key, createAutoBindDecorator(prototype, key, descriptor));
  }
}

type AutoBindDecorator = ClassDecorator & MethodDecorator;

function AutoBind(): AutoBindDecorator;
function AutoBind(target: AnyClass): void;
function AutoBind(_target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor;
function AutoBind(
  target?: unknown,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor
): AutoBindDecorator | PropertyDescriptor | void {
  // Support both syntaxes: @AutoBind and @AutoBind(), on a method or on a class
  if (propertyKey !== undefined && descriptor !== undefined) {
    return createAutoBindDecorator(target, propertyKey, descriptor);
  }

  if (typeof target === 'function') {
    return autoBindClass(target as AnyClass);
  }

  return ((
    decoratorTarget: unknown,
    decoratorPropertyKey?: string | symbol,
    decoratorDescriptor?: PropertyDescriptor
  ): PropertyDescriptor | void => {
    if (decoratorPropertyKey !== undefined && decoratorDescriptor !== undefined) {
      return createAutoBindDecorator(decoratorTarget, decoratorPropertyKey, decoratorDescriptor);
    }
    return autoBindClass(decoratorTarget as AnyClass);
  }) as AutoBindDecorator;
}

export { AutoBind };
