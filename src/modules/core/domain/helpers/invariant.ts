const prefix = 'Invariant failed';

function invariant(condition: unknown, message?: string | (() => string)): asserts condition;
function invariant(condition: unknown, exception?: unknown): asserts condition;
function invariant(condition: unknown, messageOrException?: unknown): asserts condition {
  if (condition) {
    return;
  }

  if (typeof messageOrException === 'string' || typeof messageOrException === 'function') {
    const provided =
      typeof messageOrException === 'function' ? (messageOrException as () => string)() : messageOrException;
    throw new Error(provided ? `${prefix}: ${provided}` : prefix);
  }

  if (messageOrException) {
    throw messageOrException;
  }

  throw new Error(prefix);
}

export { invariant };
