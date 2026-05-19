import fs from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';

/**
 * Là một import được tìm thấy trong file source.
 * Ví dụ:
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
 * kết quả parse import theo convention:
 * @/modules/user/domain/...
 * sẽ thành
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

// Regex để bắt import/export static
const importFromRegex = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
const sideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;

/**
 * Chuyển đổi đường dẫn file từ Windows sang Unix convention.
 * Ví dụ:
 * 'src\modules\user\domain\repositories\user.query.type.ts'
 * thành
 * 'src/modules/user/domain/repositories/user.query.type.ts'
 */
function toProjectPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

/**
 * Duyệt qua tất cả các file trong thư mục và subdirectories
 * Ví dụ:
 * 'src'
 * sẽ trả về
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
 * Lấy danh sách file .ts trong thư mục root (default là 'src' hoặc 'src/modules').
 * Đổi về relative project path.
 * Sort để output ổn định.
 */
export function sourceFiles(root = 'src'): string[] {
  const rootPath = path.resolve(process.cwd(), root);
  return walkFiles(rootPath)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => toProjectPath(path.relative(process.cwd(), file)))
    .sort();
}

/**
 * Đọc một file rồi trả ra danh sách import/export trong file đó.
 * Mục đích để các test kiểm tra "layer này có import layer kia không".
 * Ví dụ nếu file có:
 * import { UserFullProps } from '@/modules/user/domain/entities/user.type';
 * Thì trả:
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
 * Parse import dạng module-local.
 * Nếu import không theo dạng @/modules/<module>/<layer> thì trả null.
 * Ví dụ:
 * @/modules/post/domain/entities/post.type
 * sẽ thành
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
 * Bootstrap config/types chỉ nên được dùng ở composition root.
 * Application/infrastructure muốn dùng env/config thì tự định nghĩa config type nhỏ của layer đó,
 * sau đó bootstrap truyền giá trị vào qua constructor.
 */
export function isBootstrapConfigImport(importPath: string): boolean {
  return importPath.startsWith('@/bootstrap/config') || importPath.startsWith('@/bootstrap/types');
}

/**
 * Helper assert "không có import bị cấm".
 * 1. Duyệt từng file.
 * 2. Lấy toàn bộ import bằng importsOf.
 * 3. Đưa từng import vào rule.
 * 4. Nếu rule trả string, import đó bị xem là violation.
 * 5. Cuối cùng expect violations bằng [].
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
 * Helper assert tất cả file đều match một convention nào đó.
 */
export function expectFilesMatch(files: string[], predicate: (file: string) => boolean): void {
  expect(files.filter((file) => !predicate(file))).toEqual([]);
}
