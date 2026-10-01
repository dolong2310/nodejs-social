import { describe, it } from 'vitest';
import {
  expectFilesMatch,
  expectNoForbiddenImports,
  isBootstrapConfigImport,
  parseModuleImport,
  sourceFiles
} from './arch.helper';

// Get all files under src/modules/*/application.
const applicationFiles = sourceFiles('src/modules').filter((file) => file.includes('/application/'));

describe.concurrent('Application boundaries', () => {
  // 1. application must not depend on presentation adapters such as controllers/routes/guards/pipes/interceptors.
  it('application does not depend on presentation adapters', () => {
    expectNoForbiddenImports(applicationFiles, ({ importPath }) => {
      return importPath.startsWith('@/presentation') ? 'application must not depend on presentation' : false;
    });
  });

  // 2. application depends only on ports/contracts, not concrete infrastructure adapters.
  it('application depends on ports, not concrete infrastructure adapters', () => {
    expectNoForbiddenImports(applicationFiles, ({ importPath }) => {
      if (importPath.startsWith('@/infrastructure')) return 'application must not depend on root infrastructure';
      const moduleImport = parseModuleImport(importPath);
      return moduleImport?.layer === 'infrastructure' ? 'application must not depend on module infrastructure' : false;
    });
  });

  // 3. use-case implementations and application ports must follow project suffix conventions.
  it('use cases and application ports use project suffixes', () => {
    expectFilesMatch(
      applicationFiles.filter((file) => file.includes('/application/use-cases/')),
      (file) => /(\.usecase|\.port)\.ts$/.test(file)
    );

    expectFilesMatch(
      applicationFiles.filter((file) => file.includes('/application/ports/')),
      (file) => /\.port\.ts$/.test(file)
    );
  });

  // 4. application support folders must use suffixes that clearly describe each file role.
  it('application support folders use project suffixes', () => {
    expectFilesMatch(
      applicationFiles.filter((file) => file.includes('/application/services/')),
      (file) => /(\.service|\.service\.type)\.ts$/.test(file)
    );

    expectFilesMatch(
      applicationFiles.filter((file) => file.includes('/application/exceptions/')),
      (file) => /\.exception\.ts$/.test(file)
    );
    expectFilesMatch(
      applicationFiles.filter((file) => file.includes('/application/constants/')),
      (file) => /\.constants\.ts$/.test(file)
    );
    expectFilesMatch(
      applicationFiles.filter((file) => file.includes('/application/utils/')),
      (file) => /\.util\.ts$/.test(file)
    );
  });

  // 5. application must not import bootstrap config/types directly; config should be an application-owned small type.
  it('application receives config through application-owned types instead of bootstrap types', () => {
    expectNoForbiddenImports(applicationFiles, ({ importPath }) => {
      return isBootstrapConfigImport(importPath)
        ? 'application must not import bootstrap config or bootstrap types directly'
        : false;
    });
  });
});
