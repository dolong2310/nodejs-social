import fs from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';

/**
 * Represents an import found in a source file.
 * Example:
  {
    file: 'src/modules/user/domain/repositories/user.query.type.ts',
    importPath: '@/modules/common/domain/enums/search.enum',
    line: 1
  }
 */
type ImportRecord = {
  file: string;
  importPath: string;
  line: number;
};

/**
 * Import parse result by convention:
 * @/modules/user/domain/...
 * becomes
  {
    moduleName: 'user',
    layer: 'domain'
  }
 */
type ModuleImport = {
  moduleName: string;
  layer: string;
};

type ForbiddenImportViolation = ImportRecord & {
  reason: string;
};

type ForbiddenImportRule = (record: ImportRecord) => string | false;

// Regexes for static import/export statements.
const importFromRegex = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
const sideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;

/**
 * Convert a file path from Windows separators to the project Unix-style convention.
 * Example:
 * 'src\modules\user\domain\repositories\user.query.type.ts'
 * becomes
 * 'src/modules/user/domain/repositories/user.query.type.ts'
 */
function toProjectPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

/**
 * Walk all files in the directory and its subdirectories.
 * Example:
 * 'src'
 * returns
 * ['src/modules/user/domain/repositories/user.query.type.ts', 'src/modules/user/domain/entities/user.entity.ts']
 */
function walkFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(absolutePath);
    }
    return [absolutePath];
  });
}

/**
 * Get .ts files under the root directory (default is 'src' or 'src/modules').
 * Convert them to project-relative paths.
 * Sort for stable output.
 */
export function sourceFiles(root = 'src'): string[] {
  const rootPath = path.resolve(process.cwd(), root);
  return walkFiles(rootPath)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => toProjectPath(path.relative(process.cwd(), file)))
    .sort();
}

/**
 * Read a file and return its import/export list.
 * This lets tests check whether one layer imports another layer.
 * Example if the file contains:
 * import { UserFullProps } from '@/modules/user/domain/entities/user.type';
 * returns:
  {
    file: '...',
    importPath: '@/modules/user/domain/entities/user.type',
    line: 3
  }
 */
export function importsOf(file: string): ImportRecord[] {
  const absolutePath = path.resolve(process.cwd(), file);
  const content = fs.readFileSync(absolutePath, 'utf8');
  const imports: ImportRecord[] = [];

  for (const regex of [importFromRegex, sideEffectImportRegex]) {
    regex.lastIndex = 0;
    for (const match of content.matchAll(regex)) {
      const importPath = match[1];
      if (!importPath) continue;
      const line = content.slice(0, match.index).split('\n').length;
      imports.push({ file, importPath, line });
    }
  }

  return imports;
}

/**
 * Parse a module-local import.
 * Return null if the import does not match @/modules/<module>/<layer>.
 * Example:
 * @/modules/post/domain/entities/post.type
 * becomes
  {
    moduleName: 'post',
    layer: 'domain'
  }
 */
export function parseModuleImport(importPath: string): ModuleImport | null {
  const match = importPath.match(/^@\/modules\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return {
    moduleName: match[1]!,
    layer: match[2]!
  };
}

/**
 * Bootstrap config/types should only be used at the composition root.
 * Application/infrastructure layers should define their own small config types,
 * then bootstrap passes values through constructors.
 */
export function isBootstrapConfigImport(importPath: string): boolean {
  return importPath.startsWith('@/bootstrap/config') || importPath.startsWith('@/bootstrap/types');
}

/**
 * Helper asserting that there are no forbidden imports.
 * 1. Walk each file.
 * 2. Read all imports with importsOf.
 * 3. Pass each import to the rule.
 * 4. If the rule returns a string, the import is considered a violation.
 * 5. Finally expect violations to equal [].
 */
export function expectNoForbiddenImports(files: string[], rule: ForbiddenImportRule): void {
  const violations: ForbiddenImportViolation[] = files.flatMap((file) => {
    return importsOf(file).flatMap((record) => {
      const reason = rule(record);
      return reason ? [{ ...record, reason }] : [];
    });
  });

  expect(violations).toEqual([]);
}

/**
 * Helper asserting that all files match a convention.
 */
export function expectFilesMatch(files: string[], predicate: (file: string) => boolean): void {
  expect(files.filter((file) => !predicate(file))).toEqual([]);
}
