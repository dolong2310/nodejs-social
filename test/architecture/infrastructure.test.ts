import { describe, it } from 'vitest';
import {
  expectFilesMatch,
  expectNoForbiddenImports,
  isBootstrapConfigImport,
  parseModuleImport,
  sourceFiles
} from './arch.helper';

// Get all files under src/modules/*/infrastructure.
const moduleInfrastructureFiles = sourceFiles('src/modules').filter((file) => file.includes('/infrastructure/'));
// Get all files under src/infrastructure.
const rootInfrastructureFiles = sourceFiles('src/infrastructure');

describe.concurrent('Infrastructure boundaries', () => {
  // 1. infrastructure must not depend on presentation root files such as Express routes/controllers/constants.
  it('infrastructure does not depend on presentation', () => {
    expectNoForbiddenImports([...moduleInfrastructureFiles, ...rootInfrastructureFiles], ({ importPath }) => {
      return importPath.startsWith('@/presentation') ? 'infrastructure must not depend on presentation' : false;
    });
  });

  // 2. one module's infrastructure must not import another module's concrete infrastructure adapter.
  it('module infrastructure does not depend on another module infrastructure', () => {
    expectNoForbiddenImports(moduleInfrastructureFiles, ({ file, importPath }) => {
      const fromModule = file.match(/^src\/modules\/([^/]+)\//)?.[1];
      const moduleImport = parseModuleImport(importPath);
      if (!fromModule || !moduleImport) return false;
      if (moduleImport.moduleName === 'core') return false;
      if (moduleImport.moduleName === fromModule || moduleImport.layer !== 'infrastructure') return false;
      return 'module infrastructure must not depend on another module infrastructure';
    });
  });

  // 3. persistence adapters must use project suffix conventions.
  it('persistence adapters use project suffixes', () => {
    expectFilesMatch(
      moduleInfrastructureFiles.filter((file) => file.includes('/infrastructure/persistence/')),
      (file) => /(\.impl\.repository|\.repository|\.mapper|\.model)\.ts$/.test(file)
    );
  });

  // 4. queues, schedules, and infrastructure services must use suffixes matching each file role.
  it('queue, schedule, and infrastructure services use project suffixes', () => {
    expectFilesMatch(
      moduleInfrastructureFiles.filter((file) => file.includes('/infrastructure/queue/')),
      (file) => /(\.queue|\.worker)\.ts$/.test(file)
    );
    expectFilesMatch(
      moduleInfrastructureFiles.filter((file) => file.includes('/infrastructure/schedule/')),
      (file) => /(\.schedule|\.worker)\.ts$/.test(file)
    );
    expectFilesMatch(
      moduleInfrastructureFiles.filter((file) => file.includes('/infrastructure/services/')),
      (file) => /\.service\.ts$/.test(file)
    );
  });

  // 5. infrastructure adapters receive config from bootstrap through constructors, not by importing bootstrap config/types.
  it('infrastructure adapters receive config from bootstrap instead of importing bootstrap config directly', () => {
    expectNoForbiddenImports(moduleInfrastructureFiles, ({ importPath }) => {
      return isBootstrapConfigImport(importPath)
        ? 'module infrastructure must not import bootstrap config or bootstrap types directly'
        : false;
    });
  });
});
