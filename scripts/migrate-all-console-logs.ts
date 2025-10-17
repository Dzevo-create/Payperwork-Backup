#!/usr/bin/env ts-node
/**
 * Automated Console Logging Migration Script
 *
 * Migrates all console.log/error/warn statements to structured logger
 * Usage: npx ts-node scripts/migrate-all-console-logs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationStats {
  filesProcessed: number;
  filesModified: number;
  consoleStatementsReplaced: number;
  errors: string[];
}

const stats: MigrationStats = {
  filesProcessed: 0,
  filesModified: 0,
  consoleStatementsReplaced: 0,
  errors: [],
};

// Directories to process (exclude backups, node_modules, etc.)
const INCLUDE_DIRS = ['app', 'lib', 'hooks', 'components', 'store'];
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'backup',
  'template-c1-next',
  'deprecated',
  'dist',
  'build',
];

// Map file paths to appropriate logger
function getLoggerForFile(filePath: string): { importName: string; loggerVar: string } {
  if (filePath.includes('/api/')) return { importName: 'apiLogger', loggerVar: 'apiLogger' };
  if (filePath.includes('/chat/')) return { importName: 'chatLogger', loggerVar: 'chatLogger' };
  if (filePath.includes('/library/')) return { importName: 'libraryLogger', loggerVar: 'libraryLogger' };
  if (filePath.includes('/workflows/')) return { importName: 'workflowLogger', loggerVar: 'workflowLogger' };
  if (filePath.includes('/video/')) return { importName: 'videoLogger', loggerVar: 'videoLogger' };
  if (filePath.includes('/image/')) return { importName: 'imageLogger', loggerVar: 'imageLogger' };
  if (filePath.includes('/store/')) return { importName: 'chatLogger', loggerVar: 'chatLogger' };

  // Default to base logger
  return { importName: 'logger', loggerVar: 'logger' };
}

// Determine log level from message content
function getLogLevel(message: string, method: string): 'debug' | 'info' | 'warn' | 'error' {
  if (method === 'error') return 'error';
  if (method === 'warn') return 'warn';

  // Check emoji/prefix in message
  if (message.includes('❌') || message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
    return 'error';
  }
  if (message.includes('⚠️') || message.toLowerCase().includes('warning') || message.toLowerCase().includes('skip')) {
    return 'warn';
  }
  if (message.includes('✅') || message.includes('🔄') || message.toLowerCase().includes('loading') || message.toLowerCase().includes('success')) {
    return 'info';
  }

  return 'debug';
}

// Extract context object from console.log arguments
function extractContext(args: string | undefined): string | null {
  if (!args) return null;

  // Match object literals: { key: value, ... }
  const objectMatch = args.match(/\{[^}]+\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  // Match variable names that might be context objects
  const varMatch = args.match(/,\s*(\w+)\s*$/);
  if (varMatch && varMatch[1] && !['error', 'err', 'e'].includes(varMatch[1])) {
    return varMatch[1];
  }

  return null;
}

// Clean message string (remove emojis, they'll be added by logger)
function cleanMessage(msg: string): string {
  return msg
    .replace(/^['"`]/, '')
    .replace(/['"`]$/, '')
    .replace(/^(✅|❌|⚠️|🔄|🔍|ℹ️|🎯|🆕|⏭️|🧹)\s*/, '')
    .trim();
}

// Process a single file
function processFile(filePath: string): boolean {
  stats.filesProcessed++;

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Check if file already imports logger
  const hasLoggerImport = content.includes("from '@/lib/logger'") || content.includes('from "@/lib/logger"');
  const { importName, loggerVar } = getLoggerForFile(filePath);

  let replacementCount = 0;

  // Pattern 1: console.log('message', context)
  const pattern1 = /console\.(log|error|warn)\((['"`])(.+?)\2(?:,\s*(.+?))?\);?/g;
  content = content.replace(pattern1, (_match, method, _quote, message, args) => {
    replacementCount++;
    const level = getLogLevel(message, method);
    const cleanMsg = cleanMessage(message);
    const context = args ? extractContext(args) : null;

    if (level === 'error' && args && (args.includes('error') || args.includes('err'))) {
      // Error with error object
      return `${loggerVar}.${level}('${cleanMsg}', ${args.split(',')[0].trim()});`;
    } else if (context) {
      // Has context
      return `${loggerVar}.${level}('${cleanMsg}', ${context});`;
    } else {
      // Simple message
      return `${loggerVar}.${level}('${cleanMsg}');`;
    }
  });

  // Pattern 2: console.log with template literals
  const pattern2 = /console\.(log|error|warn)\(`(.+?)`(?:,\s*(.+?))?\);?/g;
  content = content.replace(pattern2, (_match, method, message, args) => {
    replacementCount++;
    const level = getLogLevel(message, method);
    const cleanMsg = cleanMessage(message);
    const context = args ? extractContext(args) : null;

    if (context) {
      return `${loggerVar}.${level}(\`${cleanMsg}\`, ${context});`;
    } else {
      return `${loggerVar}.${level}(\`${cleanMsg}\`);`;
    }
  });

  // Pattern 3: Multi-line console.log
  const pattern3 = /console\.(log|error|warn)\(\s*(['"`])([^'"`]+)\2,?\s*(\{[\s\S]+?\})\s*\);?/g;
  content = content.replace(pattern3, (_match, method, _quote, message, context) => {
    replacementCount++;
    const level = getLogLevel(message, method);
    const cleanMsg = cleanMessage(message);
    return `${loggerVar}.${level}('${cleanMsg}', ${context});`;
  });

  // If we made replacements, add import if needed
  if (replacementCount > 0 && !hasLoggerImport) {
    // Find where to insert import (after other imports, or at top)
    const importMatch = content.match(/^(import .+?from .+?;?\n)+/m);
    if (importMatch) {
      const lastImportIndex = importMatch[0].lastIndexOf('\n');
      const insertPosition = importMatch.index! + lastImportIndex + 1;
      content =
        content.slice(0, insertPosition) +
        `import { ${importName} } from '@/lib/logger';\n` +
        content.slice(insertPosition);
    } else {
      // No imports found, add at top
      content = `import { ${importName} } from '@/lib/logger';\n\n` + content;
    }
  }

  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    stats.filesModified++;
    stats.consoleStatementsReplaced += replacementCount;
    return true;
  }

  return false;
}

// Recursively find all TypeScript/TSX files
function findFiles(dir: string): string[] {
  const files: string[] = [];

  // Check if directory should be excluded
  const dirName = path.basename(dir);
  if (EXCLUDE_PATTERNS.some(pattern => dirName.includes(pattern))) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      // Skip certain files
      if (entry.name === 'logger.ts' || entry.name.includes('.test.') || entry.name.includes('.spec.')) {
        continue;
      }
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
async function main() {
  console.log('🚀 Starting automated console.log migration...\n');

  const rootDir = path.join(__dirname, '..');

  // Find all files to process
  const allFiles: string[] = [];
  for (const dir of INCLUDE_DIRS) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Scanning ${dir}/...`);
      allFiles.push(...findFiles(dirPath));
    }
  }

  console.log(`\n📊 Found ${allFiles.length} TypeScript files to process\n`);

  // Process each file
  let progressCount = 0;
  for (const file of allFiles) {
    progressCount++;
    const relativePath = path.relative(rootDir, file);

    try {
      const modified = processFile(file);
      if (modified) {
        console.log(`✅ [${progressCount}/${allFiles.length}] ${relativePath}`);
      }
    } catch (error) {
      const errorMsg = `Failed to process ${relativePath}: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`Files Processed:       ${stats.filesProcessed}`);
  console.log(`Files Modified:        ${stats.filesModified}`);
  console.log(`Console Statements:    ${stats.consoleStatementsReplaced} replaced`);
  console.log(`Errors:                ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('\n✅ Migration complete!');
  console.log('\n📝 Next steps:');
  console.log('  1. Review the changes: git diff');
  console.log('  2. Run TypeScript check: npm run type-check');
  console.log('  3. Test the application: npm run dev');
  console.log('  4. Fix any remaining console.log manually');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
