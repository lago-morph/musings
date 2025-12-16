#!/usr/bin/env node

/**
 * Site Validation Script
 * 
 * Validates the Hugo site structure and content integrity
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(SITE_DIR, 'content', 'docs');

console.log('🔍 Validating Hugo Documentation Site');
console.log('====================================');

let errors = [];
let warnings = [];

// Check Hugo configuration
console.log('\n📋 Checking Hugo configuration...');
const hugoConfigPath = path.join(SITE_DIR, 'hugo.toml');
if (fs.existsSync(hugoConfigPath)) {
  const config = fs.readFileSync(hugoConfigPath, 'utf8');
  
  if (!config.includes('[taxonomies]')) {
    errors.push('Hugo configuration missing taxonomies section');
  }
  
  if (!config.includes('category = "categories"')) {
    errors.push('Hugo configuration missing category taxonomy');
  }
  
  if (!config.includes('tag = "tags"')) {
    errors.push('Hugo configuration missing tag taxonomy');
  }
  
  console.log('✓ Hugo configuration found');
} else {
  errors.push('Hugo configuration file (hugo.toml) not found');
}

// Check category structure
console.log('\n📁 Checking category structure...');
const expectedCategories = ['ai-ml', 'devplatform', 'infrastructure', 'workflows'];
const categoryStats = {};

expectedCategories.forEach(category => {
  const categoryPath = path.join(CONTENT_DIR, category);
  const indexPath = path.join(categoryPath, '_index.md');
  
  if (fs.existsSync(categoryPath)) {
    if (fs.existsSync(indexPath)) {
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md') && file !== '_index.md');
      categoryStats[category] = files.length;
      console.log(`✓ ${category}: ${files.length} documents`);
    } else {
      errors.push(`Category ${category} missing _index.md file`);
    }
  } else {
    warnings.push(`Category directory ${category} not found`);
    categoryStats[category] = 0;
  }
});

// Check document front matter
console.log('\n📄 Checking document front matter...');
let documentsChecked = 0;
let frontMatterErrors = 0;

expectedCategories.forEach(category => {
  const categoryPath = path.join(CONTENT_DIR, category);
  if (fs.existsSync(categoryPath)) {
    const files = fs.readdirSync(categoryPath)
      .filter(file => file.endsWith('.md') && file !== '_index.md');
    
    files.forEach(file => {
      const filePath = path.join(categoryPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      documentsChecked++;
      
      if (!content.startsWith('---')) {
        errors.push(`${category}/${file}: Missing front matter`);
        frontMatterErrors++;
        return;
      }
      
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontMatterMatch) {
        errors.push(`${category}/${file}: Malformed front matter`);
        frontMatterErrors++;
        return;
      }
      
      const frontMatter = frontMatterMatch[1];
      
      // Check required fields
      const requiredFields = ['title', 'summary', 'keywords', 'category'];
      requiredFields.forEach(field => {
        if (!frontMatter.includes(`${field}:`)) {
          errors.push(`${category}/${file}: Missing ${field} field`);
          frontMatterErrors++;
        }
      });
    });
  }
});

console.log(`✓ Checked ${documentsChecked} documents`);
if (frontMatterErrors > 0) {
  console.log(`⚠️  Found ${frontMatterErrors} front matter issues`);
}

// Check Hugo build
console.log('\n🏗️  Checking Hugo build...');
const publicDir = path.join(SITE_DIR, 'public');
if (fs.existsSync(publicDir)) {
  const indexHtml = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    console.log('✓ Hugo site built successfully');
  } else {
    warnings.push('Hugo site built but index.html not found');
  }
} else {
  warnings.push('Hugo site not built (run hugo command first)');
}

// Results
console.log('\n📊 Validation Results');
console.log('====================');
console.log(`Documents processed: ${documentsChecked}`);
console.log(`Categories: ${Object.keys(categoryStats).length}`);
console.log(`Total documents: ${Object.values(categoryStats).reduce((a, b) => a + b, 0)}`);

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ All validations passed!');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} error(s) found:`);
    errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warning(s):`);
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
}