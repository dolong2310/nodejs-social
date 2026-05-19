import { filesOfProject } from 'tsarch';
import { describe, expect, it } from 'vitest';
import { expectFilesMatch, expectNoForbiddenImports, parseModuleImport, sourceFiles } from './arch.helper';

// Lấy toàn bộ file thuộc src/modules/*/domain.
const domainFiles = sourceFiles('src/modules').filter((file) => file.includes('/domain/'));

describe.concurrent('Domain boundaries', () => {
  // 1. domain không được phép import application, infrastructure, presentation, bootstrap
  it('domain does not depend on application, infrastructure, presentation, or bootstrap', () => {
    expectNoForbiddenImports(domainFiles, ({ importPath }) => {
      if (importPath.startsWith('@/presentation')) return 'domain must not depend on presentation';
      if (importPath.startsWith('@/bootstrap')) return 'domain must not depend on bootstrap';
      if (importPath.startsWith('@/infrastructure')) return 'domain must not depend on root infrastructure';

      const moduleImport = parseModuleImport(importPath);
      if (moduleImport?.layer === 'application') return 'domain must not depend on application';
      if (moduleImport?.layer === 'infrastructure') return 'domain must not depend on infrastructure';

      return false;
    });
  });

  // 2. folder domain phải không có cycle
  it('domain files are cycle free', async () => {
    const rule = filesOfProject().inFolder('src/modules/*/domain').should().beFreeOfCycles();

    await expect(rule).toPassAsync();
  });

  // 3. folder domain phải theo convention hiện tại
  it('domain folder names match the current module convention', () => {
    const allowedDomainFolders = new Set([
      'entities',
      'enums',
      'exceptions',
      'helpers',
      'repositories',
      'value-objects'
    ]);
    const filesWithUnknownDomainFolder = domainFiles.filter((file) => {
      const folder = file.match(/^src\/modules\/[^/]+\/domain\/([^/]+)/)?.[1];
      return folder && !allowedDomainFolders.has(folder);
    });

    expect(filesWithUnknownDomainFolder).toEqual([]);
  });

  // 4. suffix file domain phải theo convention hiện tại
  it('domain entities, value objects, and repository ports use project suffixes', () => {
    expectFilesMatch(
      domainFiles.filter((file) => file.includes('/domain/entities/')),
      (file) => /(\.entity|\.type)\.ts$/.test(file)
    );
    expectFilesMatch(
      domainFiles.filter((file) => file.includes('/domain/value-objects/')),
      (file) => /(\.value-object|\.base)\.ts$/.test(file)
    );
    expectFilesMatch(
      domainFiles.filter((file) => file.includes('/domain/repositories/')),
      (file) =>
        /(\.repository|\.repository\.type|\.query\.repository|\.query\.type|\.command\.repository|\.command\.type)\.ts$/.test(
          file
        )
    );
  });
});
