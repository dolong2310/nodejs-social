import { describe, it } from 'vitest';
import {
  expectFilesMatch,
  expectNoForbiddenImports,
  isBootstrapConfigImport,
  parseModuleImport,
  sourceFiles
} from './arch.helper';

// Lấy toàn bộ file thuộc src/modules/*/application.
const applicationFiles = sourceFiles('src/modules').filter((file) => file.includes('/application/'));

describe.concurrent('Application boundaries', () => {
  // 1. application không được phụ thuộc presentation adapters như controller/route/guard/pipe/interceptor.
  it('application does not depend on presentation adapters', () => {
    expectNoForbiddenImports(applicationFiles, ({ importPath }) => {
      return importPath.startsWith('@/presentation') ? 'application must not depend on presentation' : false;
    });
  });

  // 2. application chỉ phụ thuộc port/contract, không phụ thuộc concrete infrastructure adapter.
  it('application depends on ports, not concrete infrastructure adapters', () => {
    expectNoForbiddenImports(applicationFiles, ({ importPath }) => {
      if (importPath.startsWith('@/infrastructure')) return 'application must not depend on root infrastructure';
      const moduleImport = parseModuleImport(importPath);
      return moduleImport?.layer === 'infrastructure' ? 'application must not depend on module infrastructure' : false;
    });
  });

  // 3. use-case implementation và application port phải theo suffix convention của project.
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

  // 4. các folder support trong application phải dùng suffix rõ vai trò file.
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
      (file) => /\.constant\.ts$/.test(file)
    );
    expectFilesMatch(
      applicationFiles.filter((file) => file.includes('/application/utils/')),
      (file) => /\.util\.ts$/.test(file)
    );
  });

  // 5. application không được import bootstrap config/types trực tiếp; config phải là type nhỏ do application sở hữu.
  it('application receives config through application-owned types instead of bootstrap types', () => {
    expectNoForbiddenImports(applicationFiles, ({ importPath }) => {
      return isBootstrapConfigImport(importPath)
        ? 'application must not import bootstrap config or bootstrap types directly'
        : false;
    });
  });
});
