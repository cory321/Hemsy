#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of test files that need to be updated
const testFiles = [
  'src/__tests__/unit/components/appointments/MonthViewDesktop.test.tsx',
  'src/__tests__/unit/components/appointments/DayView.test.tsx',
  'src/__tests__/unit/components/appointments/CalendarWithQuery.navigation.test.tsx',
  'src/__tests__/unit/components/appointments/WeekViewDesktop.time-slot-click.test.tsx',
  'src/components/appointments/Calendar.test.tsx',
  'src/__tests__/unit/components/appointments/WeekView.time-slot-click.test.tsx',
];

// Function to remove title fields from test data
function updateTestFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove lines that are just "title: '...',"
    content = content.replace(/^\s*title:\s*['"`].*['"`],?\s*$/gm, '');

    // Remove inline title properties in objects
    content = content.replace(/,?\s*title:\s*['"`][^'"`]*['"`],?/g, (match) => {
      // If the match starts with a comma, keep it if there's something after
      if (match.startsWith(',')) {
        return match.endsWith(',') ? ',' : '';
      }
      // If it ends with a comma, remove the whole thing
      return '';
    });

    // Clean up any double commas or trailing commas before closing braces
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/,\s*}/g, '}');
    content = content.replace(/,\s*\]/g, ']');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update all test files
console.log('Updating test files to remove title field...\n');
testFiles.forEach(updateTestFile);
console.log('\nDone!');
