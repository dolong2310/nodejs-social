import { JestResultFactory, JestViolationFactory } from 'tsarch';
import { expect } from 'vitest';

// Extend Vitest expect to support tsarch
expect.extend({
  async toPassAsync(checkable) {
    if (!checkable) {
      return JestResultFactory.error('expected something checkable as an argument for expect()');
    }
    const violations = await checkable.check();
    const jestViolations = violations.map((violation) => JestViolationFactory.from(violation));
    return JestResultFactory.result(this.isNot, jestViolations);
  }
});
