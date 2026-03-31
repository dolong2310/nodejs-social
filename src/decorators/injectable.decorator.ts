import { Constructor } from '@/interfaces';

type InjectableDecorator = <T extends Constructor>(target: T) => T | void;

function Injectable(): InjectableDecorator;
function Injectable(target: Constructor): void;
function Injectable(target?: Constructor): void | InjectableDecorator {
  // If used as @Injectable
  if (target) {
    // Do nothing or attach metadata if needed
    return;
  }
  // If used as @Injectable()
  return function <T extends Constructor>(targetClass: T): T {
    return targetClass;
  };
}

export { Injectable };
