#!/bin/bash
# Fix syntax errors from console.log replacement

echo "🔧 Fixing logger syntax errors..."

# Fix data0:, data1:, data2:, etc. patterns
find app components lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/{ data0: /{ value: /g' \
  -e 's/, data1: /, /g' \
  -e 's/, data2: /, /g' \
  -e 's/, data3: /, /g' \
  -e 's/, data4: /, /g' \
  {} \;

echo "✅ Fixed syntax errors"
echo ""
echo "Running lint check..."
npm run lint --fix 2>&1 | tail -20
