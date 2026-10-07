import { describe, it } from 'vitest';
import { expectFilesMatch, expectNoForbiddenImports, parseModuleImport, sourceFiles } from './arch.helper';

// Get all files under src/presentation.
const presentationFiles = sourceFiles('src/presentation');
// Get all files under src/presentation/controllers.
const controllerFiles = presentationFiles.filter((file) => file.includes('/controllers/'));
// Get all files under src/presentation/worker.
const workerFiles = presentationFiles.filter((file) => file.startsWith('src/presentation/worker/'));

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

  // 3. queue workers call use-case ports only; business logic lives in the use case, not in the BullMQ consumer.
  it('workers depend on use-case ports, not use-case implementations, repositories, or services', () => {
    expectNoForbiddenImports(workerFiles, ({ importPath }) => {
      if (/\.usecase$/.test(importPath)) {
        return 'worker must not depend on use-case implementation';
      }
      if (importPath.includes('/domain/repositories/')) {
        return 'worker must not depend on repository ports directly';
      }
      if (importPath.includes('/application/services/')) {
        return 'worker must not depend on application services directly';
      }
      return false;
    });
  });

  // 4. HTTP and Socket.IO run in the API process, workers run in the worker process; neither imports the other.
  it('api presentation and worker presentation do not depend on each other', () => {
    expectNoForbiddenImports(presentationFiles, ({ file, importPath }) => {
      const fromWorker = file.startsWith('src/presentation/worker/');
      const toWorker = importPath.startsWith('@/presentation/worker');
      if (!fromWorker && toWorker) return 'http/socket presentation must not depend on worker presentation';
      if (fromWorker && importPath.startsWith('@/presentation/') && !toWorker) {
        return 'worker presentation must not depend on http/socket presentation';
      }
      return false;
    });
  });

  // 5. main HTTP adapters must use suffixes matching each file role.
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

  // 6. queue worker adapters must use the worker suffix.
  it('worker presentation adapters use project suffixes', () => {
    expectFilesMatch(
      workerFiles.filter((file) => file.includes('/features/')),
      (file) => /\.worker\.ts$/.test(file)
    );
  });

  // 7. valibot request/response schemas must clearly express data direction.
  it('http schemas use request, response, or schema suffixes', () => {
    expectFilesMatch(
      presentationFiles.filter((file) => file.includes('/schemas/')),
      (file) => /(\.request\.schema|\.response\.schema|\.schema)\.ts$/.test(file)
    );
  });
});
