function invariant(condition: unknown, message?: string | (() => string)): asserts condition;
function invariant(condition: unknown, exception?: unknown): asserts condition;
function invariant(condition: unknown, messageOrException?: unknown): asserts condition {
  if (condition) {
    return;
  }

  if (typeof messageOrException === 'function') {
    throw new Error((messageOrException as () => string)());
  }

  if (typeof messageOrException === 'string') {
    throw new Error(messageOrException);
  }

  if (typeof messageOrException !== 'undefined') {
    throw messageOrException;
  }

  throw new Error('Invariant violation');
}

export { invariant };
