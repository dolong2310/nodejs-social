import { describe, it } from 'vitest';
import { expectFilesMatch, expectNoForbiddenImports, parseModuleImport, sourceFiles } from './arch.helper';

// Get all files under src/presentation.
const presentationFiles = sourceFiles('src/presentation');
// Get all files under src/presentation/controllers.
const controllerFiles = presentationFiles.filter((file) => file.includes('/controllers/'));

describe.concurrent('Presentation boundaries', () => {
  // 1. presentation must not depend on concrete module infrastructure adapters.
  it('presentation does not depend on module infrastructure adapters', () => {
    expectNoForbiddenImports(presentationFiles, ({ importPath }) => {
      const moduleImport = parseModuleImport(importPath);
      return moduleImport?.layer === 'infrastructure' ? 'presentation must not depend on module infrastructure' : false;
    });
  });

  // 2. controllers call use-case ports only, not implementations, repository ports, or infrastructure.
  it('controllers depend on use-case ports, not use-case implementations or repositories', () => {
    expectNoForbiddenImports(controllerFiles, ({ importPath }) => {
      if (/\.usecase$/.test(importPath) || importPath.endsWith('.usecase')) {
        return 'controller must not depend on use-case implementation';
      }
      if (importPath.includes('/domain/repositories/')) {
        return 'controller must not depend on repository ports directly';
      }
      const moduleImport = parseModuleImport(importPath);
      return moduleImport?.layer === 'infrastructure' ? 'controller must not depend on module infrastructure' : false;
    });
  });

  // 3. main HTTP adapters must use suffixes matching each file role.
  it('http presentation adapters use project suffixes', () => {
    expectFilesMatch(
      presentationFiles.filter((file) => file.includes('/controllers/')),
      (file) => /\.controller\.ts$/.test(file)
    );
    expectFilesMatch(
      presentationFiles.filter((file) => file.includes('/routes/')),
      (file) => /\.route\.ts$/.test(file)
    );
    expectFilesMatch(
      presentationFiles.filter((file) => file.includes('/pipes/')),
      (file) => /\.pipe\.ts$/.test(file)
    );
    expectFilesMatch(
      presentationFiles.filter((file) => file.includes('/guards/')),
      (file) => /\.guard\.ts$/.test(file)
    );
    expectFilesMatch(
      presentationFiles.filter((file) => file.includes('/interceptors/')),
      (file) => /\.interceptor\.ts$/.test(file)
    );
    expectFilesMatch(
      presentationFiles.filter((file) => file.includes('/filters/')),
      (file) => /\.filter\.ts$/.test(file)
    );
  });

  // 4. request/response DTOs must clearly express data direction.
  it('http dtos use request or response suffixes', () => {
    expectFilesMatch(
      presentationFiles.filter((file) => file.includes('/dtos/')),
      (file) => /(\.request\.dto|\.response\.dto)\.ts$/.test(file)
    );
  });
});
