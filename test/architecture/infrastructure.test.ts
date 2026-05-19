import { describe, it } from 'vitest';
import {
  expectFilesMatch,
  expectNoForbiddenImports,
  isBootstrapConfigImport,
  parseModuleImport,
  sourceFiles
} from './arch.helper';

// Lấy toàn bộ file thuộc src/modules/*/infrastructure.
const moduleInfrastructureFiles = sourceFiles('src/modules').filter((file) => file.includes('/infrastructure/'));
// Lấy toàn bộ file thuộc src/infrastructure.
const rootInfrastructureFiles = sourceFiles('src/infrastructure');

describe.concurrent('Infrastructure boundaries', () => {
  // 1. infrastructure không được phụ thuộc presentation root như Express route/controller/constant.
  it('infrastructure does not depend on presentation', () => {
    expectNoForbiddenImports([...moduleInfrastructureFiles, ...rootInfrastructureFiles], ({ importPath }) => {
      return importPath.startsWith('@/presentation') ? 'infrastructure must not depend on presentation' : false;
    });
  });

  // 2. infrastructure của một module không được import concrete infrastructure adapter của module khác.
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

  // 3. persistence adapter phải dùng suffix theo convention của project.
  it('persistence adapters use project suffixes', () => {
    expectFilesMatch(
      moduleInfrastructureFiles.filter((file) => file.includes('/infrastructure/persistence/')),
      (file) => /(\.impl\.repository|\.repository|\.mapper|\.model)\.ts$/.test(file)
    );
  });

  // 4. queue, schedule, infrastructure service phải dùng suffix theo vai trò file.
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

  // 5. infrastructure adapter nhận config từ bootstrap qua constructor, không tự import bootstrap config/types.
  it('infrastructure adapters receive config from bootstrap instead of importing bootstrap config directly', () => {
    expectNoForbiddenImports(moduleInfrastructureFiles, ({ importPath }) => {
      return isBootstrapConfigImport(importPath)
        ? 'module infrastructure must not import bootstrap config or bootstrap types directly'
        : false;
    });
  });
});
