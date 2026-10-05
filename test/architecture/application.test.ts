import { describe, expect, it } from 'vitest';
import {
  expectFilesMatch,
  expectNoForbiddenImports,
  externalPackageOf,
  importsOf,
  INNER_LAYER_ALLOWED_PACKAGES,
  isBootstrapConfigImport,
  parseModuleImport,
  sourceFiles
} from './arch.helper';

// Known violations still to fix: media reaches the filesystem directly instead of through its storage ports.
// Remove an entry once it is fixed; the last test fails if an entry no longer matches the code.
const KNOWN_THIRD_PARTY_IMPORTS: Readonly<Record<string, readonly string[]>> = {
  'src/modules/media/application/ports/file-storage.port.ts': ['fs'],
  'src/modules/media/application/ports/object-storage.port.ts': ['node:stream'],
  'src/modules/media/application/use-cases/get-static-video-stream/get-static-video-stream.usecase.ts': ['path'],
  'src/modules/media/application/use-cases/upload-image/upload-image.usecase.ts': ['path']
};

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
      (file) => /(\.service|\.service\.types)\.ts$/.test(file)
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

  // 6. application only uses allowed utility packages; frameworks, I/O and transports stay behind ports.
  it('application imports only allowed third-party packages', () => {
    expectNoForbiddenImports(applicationFiles, ({ file, importPath }) => {
      const pkg = externalPackageOf(importPath);
      if (!pkg || INNER_LAYER_ALLOWED_PACKAGES.has(pkg)) return false;
      if (KNOWN_THIRD_PARTY_IMPORTS[file]?.includes(pkg)) return false;
      return `application must not import third-party package ${pkg}`;
    });
  });

  // 7. the known-violation list must not go stale once a violation is fixed.
  it('known third-party import violations still exist', () => {
    const stale = Object.entries(KNOWN_THIRD_PARTY_IMPORTS).flatMap(([file, packages]) => {
      const imported = new Set(importsOf(file).map((record) => externalPackageOf(record.importPath)));
      return packages.filter((pkg) => !imported.has(pkg)).map((pkg) => `${file}: ${pkg}`);
    });

    expect(stale).toEqual([]);
  });
});
