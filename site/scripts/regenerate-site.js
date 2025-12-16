#!/usr/bin/env node

/**
 * Hugo Documentation Site Regeneration Script
 * 
 * This script executes the complete content processing pipeline:
 * 1. Analyzes all markdown documents in the repository
 * 2. Extracts titles, generates summaries, and creates keywords
 * 3. Adds front matter to documents while preserving original content
 * 4. Copies processed documents to Hugo content directory organized by category
 * 5. Builds the Hugo site
 * 
 * Usage: node regenerate-site.js [--build-only]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SCRIPTS_DIR = __dirname;
const SITE_DIR = path.join(SCRIPTS_DIR, '..');
const REPO_ROOT = path.join(SITE_DIR, '..');

console.log('🚀 Hugo Documentation Site Regeneration');
console.log('=====================================');

// Check if this is build-only mode
const buildOnly = process.argv.includes('--build-only');

if (!buildOnly) {
  console.log('\n📊 Step 1: Analyzing documents...');
  try {
    execSync('node content-analyzer.js', { 
      cwd: SCRIPTS_DIR, 
      stdio: 'inherit' 
    });
    console.log('✓ Document analysis complete');
  } catch (error) {
    console.error('✗ Document analysis failed:', error.message);
    process.exit(1);
  }

  console.log('\n📝 Step 2: Generating summaries...');
  try {
    execSync('node summary-generator.js', { 
      cwd: SCRIPTS_DIR, 
      stdio: 'inherit' 
    });
    console.log('✓ Summary generation complete');
  } catch (error) {
    console.error('✗ Summary generation failed:', error.message);
    process.exit(1);
  }

  console.log('\n🏷️  Step 3: Extracting keywords...');
  try {
    execSync('node keyword-extractor.js', { 
      cwd: SCRIPTS_DIR, 
      stdio: 'inherit' 
    });
    console.log('✓ Keyword extraction complete');
  } catch (error) {
    console.error('✗ Keyword extraction failed:', error.message);
    process.exit(1);
  }

  console.log('\n📋 Step 4: Enhancing front matter...');
  try {
    execSync('node front-matter-enhancer.js', { 
      cwd: SCRIPTS_DIR, 
      stdio: 'inherit' 
    });
    console.log('✓ Front matter enhancement complete');
  } catch (error) {
    console.error('✗ Front matter enhancement failed:', error.message);
    process.exit(1);
  }

  console.log('\n🏷️  Step 4.5: Generating enhanced titles...');
  try {
    execSync('node enhanced-title-generator.js', { 
      cwd: SCRIPTS_DIR, 
      stdio: 'inherit' 
    });
    execSync('node update-front-matter-with-enhanced-titles.js', { 
      cwd: SCRIPTS_DIR, 
      stdio: 'inherit' 
    });
    console.log('✓ Enhanced title generation complete');
  } catch (error) {
    console.error('✗ Enhanced title generation failed:', error.message);
    process.exit(1);
  }

  console.log('\n📁 Step 5: Copying to Hugo content directory...');
  try {
    execSync('node copy-to-hugo.js', { 
      cwd: SCRIPTS_DIR, 
      stdio: 'inherit' 
    });
    console.log('✓ Content copying complete');
  } catch (error) {
    console.error('✗ Content copying failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('\n⚡ Build-only mode: Skipping content processing');
}

console.log('\n🏗️  Step 6: Building Hugo site...');
try {
  // Set Hugo path and build
  const hugoPath = `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe`;
  
  // Build the site
  execSync(`powershell -Command "$env:PATH = $env:PATH + ';${hugoPath}'; hugo"`, { 
    cwd: SITE_DIR, 
    stdio: 'inherit' 
  });
  console.log('✓ Hugo site build complete');
} catch (error) {
  console.error('✗ Hugo build failed:', error.message);
  process.exit(1);
}

// Generate statistics
console.log('\n📈 Generating site statistics...');
try {
  const contentDir = path.join(SITE_DIR, 'content', 'docs');
  const categories = ['ai-ml', 'devplatform', 'infrastructure', 'workflows'];
  const stats = {
    totalDocuments: 0,
    categories: {}
  };

  categories.forEach(category => {
    const categoryPath = path.join(contentDir, category);
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md') && file !== '_index.md');
      stats.categories[category] = files.length;
      stats.totalDocuments += files.length;
    } else {
      stats.categories[category] = 0;
    }
  });

  console.log('\n📊 Site Statistics:');
  console.log(`   Total documents: ${stats.totalDocuments}`);
  console.log('   By category:');
  Object.entries(stats.categories).forEach(([category, count]) => {
    console.log(`     ${category}: ${count} documents`);
  });

  // Save statistics
  fs.writeFileSync(
    path.join(SCRIPTS_DIR, 'site-stats.json'), 
    JSON.stringify(stats, null, 2)
  );

} catch (error) {
  console.warn('⚠️  Could not generate statistics:', error.message);
}

console.log('\n✅ Site regeneration complete!');
console.log('\n🌐 To view the site:');
console.log('   1. Start Hugo server: hugo server --buildDrafts --bind 0.0.0.0 --port 1313');
console.log('   2. Open: http://localhost:1313/musings/');
console.log('\n📁 Generated files:');
console.log(`   - Hugo site: ${path.join(SITE_DIR, 'public')}`);
console.log(`   - Content: ${path.join(SITE_DIR, 'content', 'docs')}`);
console.log(`   - Statistics: ${path.join(SCRIPTS_DIR, 'site-stats.json')}`);