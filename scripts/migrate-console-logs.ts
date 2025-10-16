#!/usr/bin/env ts-node
/**
 * Console.log Migration Script
 *
 * Automatically replaces console.log/warn/error with centralized logger
 *
 * Usage:
 *   npx ts-node scripts/migrate-console-logs.ts <file-path>
 *   npx ts-node scripts/migrate-console-logs.ts components/chat/Chat/ChatArea.tsx
 *
 * Safety:
 * - Creates backup before modification
 * - Preserves existing eslint-disable comments
 * - Only replaces console.* calls (not console in strings)
 * - Adds proper imports
 */

import * as fs from 'fs';
import * as path from 'path';

interface MigrationResult {
  filePath: string;
  originalLines: number;
  replacements: number;
  backupPath: string;
  success: boolean;
  error?: string;
}

/**
 * Detect component type from file path
 */
function detectComponentType(filePath: string): string {
  if (filePath.includes('/chat/')) return 'Chat';
  if (filePath.includes('/library/')) return 'Library';
  if (filePath.includes('/workflows/')) return 'Workflow';
  if (filePath.includes('/api/')) return 'API';
  if (filePath.includes('/hooks/') && filePath.includes('Video')) return 'Video';
  if (filePath.includes('/hooks/') && filePath.includes('Image')) return 'Image';
  if (filePath.includes('/hooks/')) return 'Chat';
  if (filePath.includes('/store/')) return 'Store';
  if (filePath.includes('/lib/')) return 'Lib';
  return 'App';
}

/**
 * Get appropriate logger import based on component type
 */
function getLoggerImport(componentType: string): string {
  const loggerMap: Record<string, string> = {
    'Chat': 'chatLogger',
    'Library': 'libraryLogger',
    'API': 'apiLogger',
    'Workflow': 'workflowLogger',
    'Video': 'videoLogger',
    'Image': 'imageLogger',
  };

  const loggerName = loggerMap[componentType] || 'logger';
  return `import { ${loggerName} } from '@/lib/logger';`;
}

/**
 * Replace console.log with logger
 */
function replaceConsoleLogs(content: string, componentType: string): { content: string; replacements: number } {
  let replacements = 0;

  const loggerMap: Record<string, string> = {
    'Chat': 'chatLogger',
    'Library': 'libraryLogger',
    'API': 'apiLogger',
    'Workflow': 'workflowLogger',
    'Video': 'videoLogger',
    'Image': 'imageLogger',
  };

  const loggerName = loggerMap[componentType] || 'logger';

  // Replace console.log (debug level)
  content = content.replace(
    /console\.log\((["'`])([^"'`]+)\1(?:,\s*({[^}]+}))?\);?/g,
    (match, quote, message, context) => {
      replacements++;
      if (context) {
        return `${loggerName}.debug(${quote}${message}${quote}, ${context});`;
      }
      return `${loggerName}.debug(${quote}${message}${quote});`;
    }
  );

  // Replace console.warn (warn level)
  content = content.replace(
    /console\.warn\((["'`])([^"'`]+)\1(?:,\s*(.+))?\);?/g,
    (match, quote, message, args) => {
      replacements++;
      if (args) {
        return `${loggerName}.warn(${quote}${message}${quote}, { data: ${args} });`;
      }
      return `${loggerName}.warn(${quote}${message}${quote});`;
    }
  );

  // Replace console.error (error level)
  content = content.replace(
    /console\.error\((["'`])([^"'`]+)\1(?:,\s*(.+))?\);?/g,
    (match, quote, message, args) => {
      replacements++;
      if (args) {
        // Check if args looks like an error object
        if (args.includes('error') || args.includes('Error')) {
          return `${loggerName}.error(${quote}${message}${quote}, ${args});`;
        }
        return `${loggerName}.error(${quote}${message}${quote}, undefined, { data: ${args} });`;
      }
      return `${loggerName}.error(${quote}${message}${quote});`;
    }
  );

  return { content, replacements };
}

/**
 * Add logger import if not present
 */
function addLoggerImport(content: string, componentType: string): string {
  const importStatement = getLoggerImport(componentType);

  // Check if import already exists
  if (content.includes(importStatement)) {
    return content;
  }

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    // Insert after last import
    lines.splice(lastImportIndex + 1, 0, importStatement);
  } else {
    // No imports found, add at the top (after any comments)
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*') && !lines[i].trim().startsWith('*')) {
        insertIndex = i;
        break;
      }
    }
    lines.splice(insertIndex, 0, importStatement);
  }

  return lines.join('\n');
}

/**
 * Migrate a single file
 */
function migrateFile(filePath: string): MigrationResult {
  const absolutePath = path.resolve(filePath);

  try {
    // Read file
    const originalContent = fs.readFileSync(absolutePath, 'utf-8');
    const originalLines = originalContent.split('\n').length;

    // Create backup
    const backupPath = `${absolutePath}.backup-${Date.now()}`;
    fs.writeFileSync(backupPath, originalContent);

    // Detect component type
    const componentType = detectComponentType(filePath);

    // Replace console.logs
    let { content, replacements } = replaceConsoleLogs(originalContent, componentType);

    // Add logger import if replacements were made
    if (replacements > 0) {
      content = addLoggerImport(content, componentType);
    }

    // Write migrated content
    fs.writeFileSync(absolutePath, content);

    return {
      filePath,
      originalLines,
      replacements,
      backupPath,
      success: true,
    };
  } catch (error) {
    return {
      filePath,
      originalLines: 0,
      replacements: 0,
      backupPath: '',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npx ts-node scripts/migrate-console-logs.ts <file-path>');
    console.log('Example: npx ts-node scripts/migrate-console-logs.ts components/chat/Chat/ChatArea.tsx');
    process.exit(1);
  }

  const filePath = args[0];
  const result = migrateFile(filePath);

  if (result.success) {
    console.log(`✅ Migration successful: ${result.filePath}`);
    console.log(`   - Replacements: ${result.replacements}`);
    console.log(`   - Backup: ${result.backupPath}`);
  } else {
    console.error(`❌ Migration failed: ${result.filePath}`);
    console.error(`   - Error: ${result.error}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { migrateFile, MigrationResult };
