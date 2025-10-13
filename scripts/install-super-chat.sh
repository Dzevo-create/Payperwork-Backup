#!/bin/bash

# Install Super Chat (C1) Dependencies
# This script installs all required peer dependencies for @thesysai/genui-sdk

echo "🚀 Installing Super Chat (C1) dependencies..."
echo ""
echo "Note: This uses --legacy-peer-deps due to zustand version conflict"
echo "      Project: zustand@5.0.8"
echo "      C1 needs: zustand@^4.5.5"
echo ""

# List of missing peer dependencies for C1 SDK
DEPENDENCIES=(
  "lowlight"
  "hastscript"
  "date-fns"
  "hast-util-parse-selector"
  "react-error-boundary"
  "katex"
  "rehype-katex"
  "remark-breaks"
)

echo "📦 Dependencies to install:"
for dep in "${DEPENDENCIES[@]}"; do
  echo "   - $dep"
done
echo ""

# Install with legacy peer deps
npm install "${DEPENDENCIES[@]}" --save --legacy-peer-deps

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Super Chat dependencies installed successfully!"
  echo ""
  echo "Next steps:"
  echo "   1. Run: npm run build"
  echo "   2. Toggle Super Chat in the UI"
  echo "   3. Test C1 interactive components"
else
  echo ""
  echo "❌ Installation failed. Please check the error above."
  echo ""
  echo "Common issues:"
  echo "   - npm cache permission errors → Run: sudo chown -R \$USER ~/.npm"
  echo "   - Peer dependency conflicts → Already handled with --legacy-peer-deps"
  exit 1
fi
