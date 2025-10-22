#!/usr/bin/env node
/**
 * Script to replace console.log with logger utility
 * Usage: node scripts/replace-console-log.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Directories to process
const directories = ["app", "components", "lib"];

// Find all console.log statements
function findConsoleLogs() {
  const results = [];

  directories.forEach((dir) => {
    const cmd = `grep -rn "console\\.log" --include="*.ts" --include="*.tsx" ${dir}/ 2>/dev/null || true`;
    const output = execSync(cmd, { encoding: "utf8" });

    if (output) {
      const lines = output.trim().split("\n");
      lines.forEach((line) => {
        const match = line.match(/^(.+):(\d+):(.+)$/);
        if (match) {
          results.push({
            file: match[1],
            line: parseInt(match[2]),
            content: match[3].trim(),
          });
        }
      });
    }
  });

  return results;
}

// Detect log level based on content
function detectLogLevel(content) {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("error") ||
    lowerContent.includes("❌") ||
    lowerContent.includes("failed")
  ) {
    return "error";
  }
  if (lowerContent.includes("warn") || lowerContent.includes("⚠️")) {
    return "warn";
  }
  if (lowerContent.includes("debug") || lowerContent.includes("🔍")) {
    return "debug";
  }
  return "info";
}

// Detect component/context from file path
function detectComponent(filePath) {
  if (filePath.includes("/api/")) {
    if (filePath.includes("/slides/")) return "Slides";
    if (filePath.includes("/chat/")) return "Chat";
    if (filePath.includes("/video/")) return "Video";
    if (filePath.includes("/image/")) return "Image";
    if (filePath.includes("/library/")) return "Library";
    return "API";
  }
  if (filePath.includes("components/")) return "Component";
  if (filePath.includes("lib/")) return "Library";
  return "App";
}

// Process a single file
function processFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;
  let needsImport = false;

  // Check if logger is already imported
  const hasLoggerImport =
    content.includes('from "@/lib/logger"') || content.includes("from '@/lib/logger'");

  // Process each replacement for this file
  replacements.forEach(({ original, replacement }) => {
    if (content.includes(original)) {
      content = content.replace(original, replacement);
      modified = true;
      needsImport = true;
    }
  });

  // Add logger import if needed and not present
  if (needsImport && !hasLoggerImport) {
    const component = detectComponent(filePath);
    const loggerVar = component.toLowerCase() + "Logger";

    // Check if it's an API route or regular file
    if (filePath.includes("/api/")) {
      const importStatement = `import { apiLogger } from '@/lib/logger';\n`;

      // Add import after the last import statement
      const lastImportIndex = content.lastIndexOf("import ");
      if (lastImportIndex !== -1) {
        const nextNewline = content.indexOf("\n", lastImportIndex);
        content =
          content.slice(0, nextNewline + 1) + importStatement + content.slice(nextNewline + 1);
      } else {
        content = importStatement + content;
      }
    } else {
      const importStatement = `import { logger } from '@/lib/logger';\n`;

      const lastImportIndex = content.lastIndexOf("import ");
      if (lastImportIndex !== -1) {
        const nextNewline = content.indexOf("\n", lastImportIndex);
        content =
          content.slice(0, nextNewline + 1) + importStatement + content.slice(nextNewline + 1);
      } else {
        content = importStatement + content;
      }
    }

    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }

  return false;
}

// Generate replacement for a console.log statement
function generateReplacement(logStatement, filePath) {
  const component = detectComponent(filePath);
  const isApiRoute = filePath.includes("/api/");
  const loggerVar = isApiRoute ? "apiLogger" : "logger";

  // Extract the arguments from console.log(...)
  const match = logStatement.match(/console\.log\((.*)\)/);
  if (!match) return null;

  const args = match[1];
  const level = detectLogLevel(args);

  // Simple case: single string argument
  if (args.match(/^['"`].*['"`]$/)) {
    return {
      original: logStatement,
      replacement: `${loggerVar}.${level}(${args})`,
    };
  }

  // Multiple arguments - convert to message + context
  const parts = args.split(",").map((p) => p.trim());

  if (parts.length === 1) {
    return {
      original: logStatement,
      replacement: `${loggerVar}.${level}(${parts[0]})`,
    };
  }

  // First part is message, rest is context
  const message = parts[0];
  const contextParts = parts.slice(1);

  // Build context object
  let context = "{ ";
  contextParts.forEach((part, idx) => {
    // Try to extract variable name
    const varMatch = part.match(/^(\w+)$/);
    if (varMatch) {
      context += `${varMatch[1]}`;
    } else if (part.includes(":")) {
      context += part;
    } else {
      context += `data${idx}: ${part}`;
    }
    if (idx < contextParts.length - 1) context += ", ";
  });
  context += " }";

  return {
    original: logStatement,
    replacement: `${loggerVar}.${level}(${message}, ${context})`,
  };
}

// Main execution
console.log("🔍 Finding console.log statements...\n");

const consoleLogs = findConsoleLogs();
console.log(`Found ${consoleLogs.length} console.log statements\n`);

// Group by file
const fileMap = new Map();
consoleLogs.forEach((log) => {
  if (!fileMap.has(log.file)) {
    fileMap.set(log.file, []);
  }
  fileMap.get(log.file).push(log);
});

console.log(`Files to process: ${fileMap.size}\n`);

let totalReplaced = 0;
let filesModified = 0;

// Process each file
fileMap.forEach((logs, filePath) => {
  console.log(`\n📝 Processing: ${filePath}`);
  console.log(`   Found ${logs.length} console.log statements`);

  const replacements = logs
    .map((log) => generateReplacement(log.content, filePath))
    .filter((r) => r !== null);

  if (processFile(filePath, replacements)) {
    filesModified++;
    totalReplaced += replacements.length;
    console.log(`   ✅ Replaced ${replacements.length} statements`);
  }
});

console.log("\n" + "=".repeat(50));
console.log(`✅ Complete!`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${totalReplaced}`);
console.log("=".repeat(50) + "\n");

console.log("💡 Next steps:");
console.log("   1. Review the changes with: git diff");
console.log("   2. Run tests: npm test");
console.log("   3. Check for any eslint errors: npm run lint");
console.log("");
