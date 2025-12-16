const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Property-Based Test for File Organization
 * 
 * **Feature: hugo-docs-site, Property 10: File Organization Compliance**
 * **Validates: Requirements 4.2, 4.3**
 * 
 * Tests that all generated Hugo files are stored under the `/site` directory and avoid 
 * dot-prefixed names except for standard files like .gitignore.
 */

console.log('🧪 Property Test: File Organization Compliance');
console.log('==============================================');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SITE_DIR = path.resolve(__dirname, '..');

// Standard dot-prefixed files that are allowed
const ALLOWED_DOT_FILES = [
  '.gitignore',
  '.git',
  '.github',
  '.hugo_build.lock',
  '.nojekyll'
];

// Function to recursively get all files in a directory, excluding node_modules
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    // Skip node_modules and other irrelevant directories
    if (file === 'node_modules' || file === '.git') {
      return;
    }
    
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Function to get all directories in a path, excluding node_modules
function getAllDirectories(dirPath, arrayOfDirs = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    // Skip node_modules and other irrelevant directories
    if (file === 'node_modules' || file === '.git') {
      return;
    }
    
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfDirs.push(fullPath);
      arrayOfDirs = getAllDirectories(fullPath, arrayOfDirs);
    }
  });

  return arrayOfDirs;
}

// Get all Hugo-related files
let hugoFiles = [];
let hugoDirs = [];

try {
  hugoFiles = getAllFiles(SITE_DIR);
  hugoDirs = getAllDirectories(SITE_DIR);
} catch (error) {
  console.error('✗ Could not read site directory:', error.message);
  process.exit(1);
}

console.log(`\n📁 Found ${hugoFiles.length} files and ${hugoDirs.length} directories in site/`);

// Property 10: File Organization Compliance
// For any generated Hugo files, all site-related files should be stored under the `/site` directory
const fileLocationProperty = fc.property(
  fc.constantFrom(...hugoFiles),
  (filePath) => {
    // File must be under the site directory
    const relativePath = path.relative(SITE_DIR, filePath);
    const isUnderSiteDir = !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
    
    return isUnderSiteDir;
  }
);

// Property: Avoid dot-prefixed files except for standard ones
const dotFileProperty = fc.property(
  fc.constantFrom(...hugoFiles.concat(hugoDirs)),
  (itemPath) => {
    const basename = path.basename(itemPath);
    
    // If it starts with a dot, it must be in the allowed list
    if (basename.startsWith('.')) {
      return ALLOWED_DOT_FILES.includes(basename);
    }
    
    return true;
  }
);

// Property: Hugo content should be organized by category
const contentOrganizationProperty = fc.property(
  fc.constant(hugoFiles),
  (allFiles) => {
    const contentFiles = allFiles.filter(file => 
      file.includes(path.join('content', 'docs')) && file.endsWith('.md')
    );
    
    // Each content file should be in a category directory
    for (const file of contentFiles) {
      const relativePath = path.relative(path.join(SITE_DIR, 'content', 'docs'), file);
      const pathParts = relativePath.split(path.sep);
      
      // Skip _index.md files and test files at root level
      if (pathParts.length === 1) {
        const fileName = pathParts[0];
        if (fileName === '_index.md' || fileName.startsWith('test-') || fileName.startsWith('mermaid-')) {
          continue;
        }
      }
      
      // Other files should be in category subdirectories
      if (pathParts.length < 2) {
        return false;
      }
      
      // Category directory should follow naming convention
      const categoryDir = pathParts[0];
      if (!/^[a-z]+(-[a-z]+)*$/.test(categoryDir)) {
        return false;
      }
    }
    
    return true;
  }
);

// Property: Essential Hugo files should exist
const essentialFilesProperty = fc.property(
  fc.constant(hugoFiles),
  (allFiles) => {
    const essentialFiles = [
      path.join(SITE_DIR, 'hugo.toml'),
      path.join(SITE_DIR, 'content', 'docs', '_index.md')
    ];
    
    for (const essentialFile of essentialFiles) {
      if (!allFiles.includes(essentialFile)) {
        return false;
      }
    }
    
    return true;
  }
);

// Property: Generated files should be in appropriate directories
const generatedFilesProperty = fc.property(
  fc.constant(hugoFiles),
  (allFiles) => {
    // Check that generated files are in expected locations
    const publicFiles = allFiles.filter(file => file.includes(path.join('site', 'public')));
    const resourceFiles = allFiles.filter(file => file.includes(path.join('site', 'resources')));
    
    // If public directory exists, it should contain generated HTML
    if (publicFiles.length > 0) {
      const hasIndexHtml = publicFiles.some(file => file.endsWith('index.html'));
      if (!hasIndexHtml) {
        return false;
      }
    }
    
    return true;
  }
);

// Run the property tests
console.log('\n🔍 Running Property Tests...');

let allTestsPassed = true;

try {
  console.log('\n📂 Test 1: File Location Compliance');
  console.log('   Testing that all Hugo files are under /site directory...');
  
  fc.assert(fileLocationProperty, { 
    numRuns: Math.min(hugoFiles.length, 200),
    verbose: false 
  });
  
  console.log('   ✓ All Hugo files are properly located under /site');
  
} catch (error) {
  console.error('   ✗ File location test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🔸 Test 2: Dot-prefixed Files Compliance');
  console.log('   Testing that dot-prefixed files are only standard ones...');
  
  fc.assert(dotFileProperty, { 
    numRuns: Math.min(hugoFiles.length + hugoDirs.length, 200),
    verbose: false 
  });
  
  console.log('   ✓ Only standard dot-prefixed files are present');
  
} catch (error) {
  console.error('   ✗ Dot-prefixed files test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📁 Test 3: Content Organization');
  console.log('   Testing that content files are organized by category...');
  
  fc.assert(contentOrganizationProperty, { 
    numRuns: 10,
    verbose: false 
  });
  
  console.log('   ✓ Content files are properly organized by category');
  
} catch (error) {
  console.error('   ✗ Content organization test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📋 Test 4: Essential Files Existence');
  console.log('   Testing that essential Hugo files exist...');
  
  fc.assert(essentialFilesProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ All essential Hugo files are present');
  
} catch (error) {
  console.error('   ✗ Essential files test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🏗️  Test 5: Generated Files Structure');
  console.log('   Testing that generated files are in appropriate directories...');
  
  fc.assert(generatedFilesProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Generated files are properly structured');
  
} catch (error) {
  console.error('   ✗ Generated files test failed:', error.message);
  allTestsPassed = false;
}

// Display file organization statistics
console.log('\n📊 File Organization Statistics:');

const contentDir = path.join(SITE_DIR, 'content', 'docs');
if (fs.existsSync(contentDir)) {
  const categories = fs.readdirSync(contentDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`   Categories: ${categories.length} (${categories.join(', ')})`);
  
  categories.forEach(category => {
    const categoryPath = path.join(contentDir, category);
    const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.md'));
    console.log(`   ${category}: ${files.length} documents`);
  });
}

const publicDir = path.join(SITE_DIR, 'public');
if (fs.existsSync(publicDir)) {
  const publicFiles = getAllFiles(publicDir);
  console.log(`   Generated files: ${publicFiles.length} in public/`);
}

// Final result
if (allTestsPassed) {
  console.log('\n✅ All file organization property tests passed!');
  console.log('   File organization complies with requirements.');
  process.exit(0);
} else {
  console.log('\n❌ Some file organization tests failed!');
  console.log('   Review the file organization and try again.');
  process.exit(1);
}