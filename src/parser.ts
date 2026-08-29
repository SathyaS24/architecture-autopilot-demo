import * as ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { FileInfo, ArchLayer } from './types.js';

/**
 * Recursively find all .ts files in a directory, ignoring node_modules, dist, etc.
 */
export function findTsFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      // Ignore common non-source directories
      if (
        file === 'node_modules' ||
        file === 'dist' ||
        file === '.git' ||
        file === 'coverage'
      ) {
        continue;
      }
      results = results.concat(findTsFiles(fullPath));
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Determine the architectural layer based on path/naming conventions.
 */
export function detectLayer(filePath: string): ArchLayer {
  const normPath = filePath.toLowerCase().replace(/\\/g, '/');
  if (normPath.includes('/controllers/') || normPath.endsWith('.controller.ts')) {
    return 'controllers';
  }
  if (normPath.includes('/services/') || normPath.endsWith('.service.ts')) {
    return 'services';
  }
  if (
    normPath.includes('/repositories/') ||
    normPath.endsWith('.repository.ts') ||
    normPath.includes('/repos/') ||
    normPath.endsWith('.repo.ts')
  ) {
    return 'repositories';
  }
  return 'unknown';
}

/**
 * Resolve an import path relative to the importing file's directory.
 */
export function resolveImportPath(importingFile: string, importStr: string): string | null {
  if (!importStr.startsWith('.') && !importStr.startsWith('/')) {
    // External / npm module or node built-in
    return null;
  }

  const dir = path.dirname(importingFile);
  // Remove suffix like .js, .ts if present since imports can use .js in ESM
  let cleanImportStr = importStr;
  if (importStr.endsWith('.js')) {
    cleanImportStr = importStr.substring(0, importStr.length - 3);
  } else if (importStr.endsWith('.ts')) {
    cleanImportStr = importStr.substring(0, importStr.length - 3);
  }

  const resolvedBase = path.resolve(dir, cleanImportStr);

  const extensions = ['.ts', '.tsx', '/index.ts', '.d.ts'];
  for (const ext of extensions) {
    const p = resolvedBase + ext;
    if (fs.existsSync(p)) {
      return p;
    }
    if (ext.startsWith('/') && fs.existsSync(resolvedBase)) {
      // index.ts check
      const indexP = path.join(resolvedBase, 'index.ts');
      if (fs.existsSync(indexP)) {
        return indexP;
      }
    }
  }

  // Fallback check for exact file existence if no extension was appended
  if (fs.existsSync(resolvedBase)) {
    return resolvedBase;
  }

  return null;
}

/**
 * Parse a TypeScript source file and extract details.
 */
export function parseTsFile(filePath: string): FileInfo {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const imports: string[] = [];
  const classes: string[] = [];
  const functions: string[] = [];
  const exports: string[] = [];

  function visit(node: ts.Node) {
    // Extract imports
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text);
      }
    } else if (ts.isCallExpression(node)) {
      // Dynamic imports or require calls
      if (
        node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')
      ) {
        if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
          imports.push((node.arguments[0] as ts.StringLiteral).text);
        }
      }
    } else if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text);
      }
    }

    // Extract classes
    if (ts.isClassDeclaration(node) && node.name) {
      classes.push(node.name.text);
      // Check if exported
      if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push(node.name.text);
      }
    }

    // Extract functions
    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.push(node.name.text);
      // Check if exported
      if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        exports.push(node.name.text);
      }
    }

    // Extract other named exports
    if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (isExported) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exports.push(decl.name.text);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  const layer = detectLayer(filePath);
  const dependencies: string[] = [];

  for (const imp of imports) {
    const resolved = resolveImportPath(filePath, imp);
    if (resolved) {
      dependencies.push(resolved);
    }
  }

  return {
    filePath: path.resolve(filePath),
    layer,
    imports,
    dependencies,
    classes,
    functions,
    exports,
  };
}
