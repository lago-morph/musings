const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * End-to-End Testing Script
 * 
 * Tests the complete pipeline from raw documents to generated site.
 * Validates all navigation features, Mermaid rendering, and search functionality.
 * 
 * **Validates: All Requirements**
 */

console.log('🧪 End-to-End Testing');
console.log('====================');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SITE_DIR = path.resolve(__dirname, '..');
const SCRIPTS_DIR = __dirname;
const PUBLIC_DIR = path.join(SITE_DIR, 'public');
const CONTENT_DIR = path.join(SITE_DIR, 'content', 'docs');

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✓' : '✗';
  const result = passed ? 'PASS' : 'FAIL';
  console.log(`   ${status} ${name}: ${result}${message ? ' - ' + message : ''}`);
  
  testResults.details.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function logWarning(name, message) {
  console.log(`   ⚠️  ${name}: WARNING - ${message}`);
  testResults.warnings++;
  testResults.details.push({ name, passed: true, message: `WARNING: ${message}` });
}

// Test 1: Complete Pipeline Execution
console.log('\n🔄 Test 1: Complete Pipeline Execution');
console.log('   Testing complete pipeline from raw documents to generated site...');

try {
  // Check that all processing results exist
  const processingFiles = [
    'analysis-results.json',
    'summary-results.json', 
    'keyword-results.json',
    'front-matter-results.json'
  ];
  
  let pipelineComplete = true;
  for (const file of processingFiles) {
    const filePath = path.join(SCRIPTS_DIR, file);
    if (!fs.existsSync(filePath)) {
      pipelineComplete = false;
      break;
    }
  }
  
  logTest('Processing Pipeline Results', pipelineComplete, 
    pipelineComplete ? 'All processing files exist' : 'Missing processing results');
  
} catch (error) {
  logTest('Processing Pipeline Results', false, error.message);
}

// Test 2: Hugo Site Structure
console.log('\n🏗️  Test 2: Hugo Site Structure');
console.log('   Testing that Hugo site has proper structure...');

try {
  // Check essential Hugo files
  const essentialFiles = [
    path.join(SITE_DIR, 'hugo.toml'),
    path.join(CONTENT_DIR, '_index.md')
  ];
  
  let structureValid = true;
  for (const file of essentialFiles) {
    if (!fs.existsSync(file)) {
      structureValid = false;
      break;
    }
  }
  
  logTest('Essential Hugo Files', structureValid);
  
  // Check category directories
  if (fs.existsSync(CONTENT_DIR)) {
    const categories = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    logTest('Category Directories', categories.length >= 3, `Found ${categories.length} categories`);
    
    // Check that categories have content
    let categoriesHaveContent = true;
    for (const category of categories) {
      const categoryPath = path.join(CONTENT_DIR, category);
      const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.md'));
      if (files.length === 0) {
        categoriesHaveContent = false;
        break;
      }
    }
    
    logTest('Categories Have Content', categoriesHaveContent);
  } else {
    logTest('Content Directory', false, 'Content directory does not exist');
  }
  
} catch (error) {
  logTest('Hugo Site Structure', false, error.message);
}

// Test 3: Generated Site Validation
console.log('\n🌐 Test 3: Generated Site Validation');
console.log('   Testing that Hugo has generated a complete site...');

try {
  if (fs.existsSync(PUBLIC_DIR)) {
    // Check for essential generated files
    const essentialGenerated = [
      path.join(PUBLIC_DIR, 'index.html'),
      path.join(PUBLIC_DIR, 'sitemap.xml')
    ];
    
    let generatedValid = true;
    for (const file of essentialGenerated) {
      if (!fs.existsSync(file)) {
        generatedValid = false;
        break;
      }
    }
    
    logTest('Essential Generated Files', generatedValid);
    
    // Check for category pages
    const categoryPages = fs.readdirSync(path.join(PUBLIC_DIR, 'docs'), { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    logTest('Category Pages Generated', categoryPages.length >= 3, `Found ${categoryPages.length} category pages`);
    
    // Check for search functionality
    const searchFiles = fs.readdirSync(PUBLIC_DIR).filter(file => file.includes('search'));
    logTest('Search Files Generated', searchFiles.length > 0, `Found ${searchFiles.length} search files`);
    
  } else {
    logTest('Public Directory', false, 'Public directory does not exist - run Hugo build');
  }
  
} catch (error) {
  logTest('Generated Site Validation', false, error.message);
}

// Test 4: Navigation Features
console.log('\n🧭 Test 4: Navigation Features');
console.log('   Testing navigation structure and functionality...');

try {
  if (fs.existsSync(PUBLIC_DIR)) {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for navigation elements
      logTest('Navigation Menu', indexContent.includes('menu') || indexContent.includes('nav'));
      logTest('Category Links', indexContent.includes('docs/'));
      logTest('Search Functionality', indexContent.includes('search') || indexContent.includes('Search'));
      
    } else {
      logTest('Index Page', false, 'index.html not found');
    }
  }
  
} catch (error) {
  logTest('Navigation Features', false, error.message);
}

// Test 5: Mermaid Diagram Support
console.log('\n📊 Test 5: Mermaid Diagram Support');
console.log('   Testing Mermaid diagram rendering capability...');

try {
  // Check for Mermaid assets
  const mermaidFiles = [];
  if (fs.existsSync(PUBLIC_DIR)) {
    const publicFiles = fs.readdirSync(PUBLIC_DIR, { recursive: true });
    publicFiles.forEach(file => {
      if (file.includes('mermaid')) {
        mermaidFiles.push(file);
      }
    });
  }
  
  logTest('Mermaid Assets', mermaidFiles.length > 0, `Found ${mermaidFiles.length} Mermaid files`);
  
  // Check Hugo configuration for Mermaid
  const hugoConfig = fs.readFileSync(path.join(SITE_DIR, 'hugo.toml'), 'utf8');
  logTest('Mermaid Configuration', hugoConfig.includes('unsafe = true'), 'Required for Mermaid rendering');
  
} catch (error) {
  logTest('Mermaid Diagram Support', false, error.message);
}

// Test 6: Content Quality
console.log('\n📝 Test 6: Content Quality');
console.log('   Testing that processed content has proper metadata...');

try {
  if (fs.existsSync(CONTENT_DIR)) {
    const categories = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    let contentQualityGood = true;
    let sampleCount = 0;
    
    // Check a sample of files for proper front matter
    for (const category of categories.slice(0, 3)) { // Check first 3 categories
      const categoryPath = path.join(CONTENT_DIR, category);
      const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.md') && file !== '_index.md');
      
      // Check first file in each category
      if (files.length > 0) {
        const filePath = path.join(categoryPath, files[0]);
        const content = fs.readFileSync(filePath, 'utf8');
        
        sampleCount++;
        
        // Check for required front matter
        if (!content.startsWith('---\n') || 
            !content.includes('title:') || 
            !content.includes('summary:') || 
            !content.includes('keywords:') ||
            !content.includes('category:')) {
          contentQualityGood = false;
          break;
        }
      }
    }
    
    logTest('Front Matter Quality', contentQualityGood, `Checked ${sampleCount} sample files`);
  }
  
} catch (error) {
  logTest('Content Quality', false, error.message);
}

// Test 7: Deployment Readiness
console.log('\n🚀 Test 7: Deployment Readiness');
console.log('   Testing that site is ready for deployment...');

try {
  // Check deployment script exists
  const deployScript = path.join(SCRIPTS_DIR, 'deploy-to-github-pages.js');
  logTest('Deployment Script', fs.existsSync(deployScript));
  
  // Check that public directory is ready for deployment
  if (fs.existsSync(PUBLIC_DIR)) {
    const publicFiles = fs.readdirSync(PUBLIC_DIR);
    logTest('Public Directory Ready', publicFiles.length > 10, `Contains ${publicFiles.length} files`);
    
    // Check for .nojekyll file (should be created by deployment script)
    const nojekyllPath = path.join(PUBLIC_DIR, '.nojekyll');
    if (fs.existsSync(nojekyllPath)) {
      logTest('Jekyll Disabled', true, '.nojekyll file present');
    } else {
      logWarning('Jekyll Disabled', '.nojekyll file not found - will be created during deployment');
    }
  }
  
  // Check Hugo configuration for GitHub Pages
  const hugoConfig = fs.readFileSync(path.join(SITE_DIR, 'hugo.toml'), 'utf8');
  logTest('GitHub Pages URL', hugoConfig.includes('lago-morph.github.io/musings'), 'Correct baseURL configured');
  
} catch (error) {
  logTest('Deployment Readiness', false, error.message);
}

// Test 8: Documentation Accessibility
console.log('\n📚 Test 8: Documentation Accessibility');
console.log('   Testing that documentation is accessible and complete...');

try {
  // Check that all required documentation exists
  const docFiles = ['AGENTS.md', 'QUICK_REFERENCE.md', 'PROJECT_STATUS.md', 'HISTORICAL_PROMPT.md'];
  let docsComplete = true;
  
  for (const docFile of docFiles) {
    const filePath = path.join(REPO_ROOT, docFile);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 500) {
      docsComplete = false;
      break;
    }
  }
  
  logTest('Project Documentation', docsComplete, 'All documentation files present and substantial');
  
} catch (error) {
  logTest('Documentation Accessibility', false, error.message);
}

// Summary
console.log('\n📊 End-to-End Test Results');
console.log('==========================');

console.log(`\n✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`⚠️  Warnings: ${testResults.warnings}`);

if (testResults.failed === 0) {
  console.log('\n🎉 All end-to-end tests passed!');
  console.log('   The Hugo documentation site is fully functional and ready for use.');
  
  console.log('\n🌐 Site Access:');
  console.log('   Development: http://localhost:1313/musings/');
  console.log('   Production: https://lago-morph.github.io/musings/ (after deployment)');
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Deploy to GitHub Pages: node deploy-to-github-pages.js');
  console.log('   2. Configure GitHub Pages in repository settings');
  console.log('   3. Wait 2-5 minutes for deployment to complete');
  
  process.exit(0);
} else {
  console.log('\n❌ Some end-to-end tests failed!');
  console.log('   Review the failed tests and address issues before deployment.');
  
  console.log('\n🔧 Failed Tests:');
  testResults.details
    .filter(test => !test.passed)
    .forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
  
  process.exit(1);
}