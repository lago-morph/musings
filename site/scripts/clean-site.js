#!/usr/bin/env node

/**
 * Site Cleanup Script
 * 
 * Cleans generated files and resets the site for fresh regeneration
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(SITE_DIR, 'content', 'docs');

console.log('🧹 Cleaning Hugo Documentation Site');
console.log('===================================');

// Files and directories to clean
const toClean = [
  // Hugo generated files
  path.join(SITE_DIR, 'public'),
  path.join(SITE_DIR, 'resources'),
  
  // Generated content directories
  path.join(CONTENT_DIR, 'ai-ml'),
  path.join(CONTENT_DIR, 'devplatform'),
  path.join(CONTENT_DIR, 'infrastructure'),
  path.join(CONTENT_DIR, 'workflows'),
  path.join(CONTENT_DIR, 'misc'),
  
  // Script results
  path.join(__dirname, 'analysis-results.json'),
  path.join(__dirname, 'summary-results.json'),
  path.join(__dirname, 'keyword-results.json'),
  path.join(__dirname, 'front-matter-results.json'),
  path.join(__dirname, 'copy-results.json'),
  path.join(__dirname, 'site-stats.json'),
  path.join(__dirname, 'debug-summary.js')
];

let cleanedCount = 0;
let errors = [];

console.log('\n🗑️  Removing generated files...');

toClean.forEach(itemPath => {
  try {
    if (fs.existsSync(itemPath)) {
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`✓ Removed directory: ${path.relative(SITE_DIR, itemPath)}`);
      } else {
        fs.unlinkSync(itemPath);
        console.log(`✓ Removed file: ${path.relative(SITE_DIR, itemPath)}`);
      }
      
      cleanedCount++;
    }
  } catch (error) {
    errors.push(`Failed to remove ${itemPath}: ${error.message}`);
  }
});

// Keep essential test documents
const essentialFiles = [
  path.join(CONTENT_DIR, '_index.md'),
  path.join(CONTENT_DIR, 'test-document.md'),
  path.join(CONTENT_DIR, 'mermaid-test.md')
];

console.log('\n📋 Preserving essential files...');
essentialFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✓ Preserved: ${path.relative(SITE_DIR, filePath)}`);
  }
});

// Results
console.log('\n📊 Cleanup Results');
console.log('==================');
console.log(`Items cleaned: ${cleanedCount}`);

if (errors.length > 0) {
  console.log(`\n❌ ${errors.length} error(s) during cleanup:`);
  errors.forEach(error => console.log(`   - ${error}`));
  process.exit(1);
} else {
  console.log('\n✅ Site cleanup complete!');
  console.log('\n🚀 Ready for fresh regeneration');
  console.log('   Run: node regenerate-site.js');
  process.exit(0);
}