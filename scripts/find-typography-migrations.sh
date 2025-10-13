#!/bin/bash

# Find Typography Migration Opportunities
# This script finds components that need to be migrated to the standardized typography system

echo "🔍 Finding components with inline fontSize values..."
echo ""

# Count total occurrences
TOTAL=$(grep -r "fontSize:\s*['\"\{]" src/components --include="*.tsx" --include="*.ts" | wc -l | tr -d ' ')
echo "📊 Total inline fontSize occurrences: $TOTAL"
echo ""

# List files with count
echo "📁 Files with inline fontSize (sorted by count):"
echo ""
grep -r "fontSize:\s*['\"\{]" src/components --include="*.tsx" --include="*.ts" -l | while read file; do
  count=$(grep "fontSize:\s*['\"\{]" "$file" | wc -l | tr -d ' ')
  echo "$count occurrences in $file"
done | sort -rn | head -20
echo ""

# Find specific patterns
echo "🎯 Common patterns found:"
echo ""

echo "Small text (12-14px):"
grep -r "fontSize:\s*['\"]0\.[78]" src/components --include="*.tsx" -o | sort | uniq -c | sort -rn
echo ""

echo "Medium text (15-18px):"
grep -r "fontSize:\s*['\"]0\.9" src/components --include="*.tsx" -o | sort | uniq -c | sort -rn
grep -r "fontSize:\s*['\"]1\.[0-2]" src/components --include="*.tsx" -o | sort | uniq -c | sort -rn
echo ""

echo "Large text (20px+):"
grep -r "fontSize:\s*['\"]1\.[5-9]" src/components --include="*.tsx" -o | sort | uniq -c | sort -rn
grep -r "fontSize:\s*['\"][2-9]" src/components --include="*.tsx" -o | sort | uniq -c | sort -rn
echo ""

echo "✅ Next steps:"
echo "1. Review the migration guide: docs/TYPOGRAPHY_MIGRATION_GUIDE.md"
echo "2. See the example refactoring in: src/components/clients/ClientProfileCard.tsx"
echo "3. Start with the files that have the most occurrences"
echo "4. Use the Typography variants reference in: src/constants/README.md"
echo ""
echo "💡 Pro tip: Focus on one component at a time and test thoroughly!"

