const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Property-based tests for Hugo navigation structure completeness
 * Validates Requirements 1.1, 1.2 from the specification
 */

// Test data setup
const hugoContentDir = path.join(__dirname, '..', 'content', 'docs');
const expectedCategories = ['ai-ml', 'devplatform', 'infrastructure', 'workflows'];

// Property-based tests using fast-check
function runPropertyTests() {
  console.log('Running property-based tests with fast-check...');
  
  // Property 1: All expected category directories exist
  try {
    fc.assert(fc.property(
      fc.constantFrom(...expectedCategories),
      (category) => {
        const categoryPath = path.join(hugoContentDir, category);
        const exists = fs.existsSync(categoryPath);
        const isDirectory = exists && fs.statSync(categoryPath).isDirectory();
        
        return exists && isDirectory;
      }
    ), { numRuns: 100 });
    console.log('✓ Property test: All expected category directories exist');
  } catch (error) {
    console.error('✗ Property test failed: Category directories', error.message);
  }

  // Property 2: Each category has an index file
  try {
    fc.assert(fc.property(
      fc.constantFrom(...expectedCategories),
      (category) => {
        const indexPath = path.join(hugoContentDir, category, '_index.md');
        const exists = fs.existsSync(indexPath);
        
        if (exists) {
          const content = fs.readFileSync(indexPath, 'utf8');
          const hasFrontMatter = content.startsWith('---');
          const hasTitle = content.includes('title:');
          const hasWeight = content.includes('weight:');
          
          return hasFrontMatter && hasTitle && hasWeight;
        }
        
        return false;
      }
    ), { numRuns: 100 });
    console.log('✓ Property test: Each category has proper index file');
  } catch (error) {
    console.error('✗ Property test failed: Category index files', error.message);
  }

  // Property 3: Document front matter validation
  try {
    const allDocuments = [];
    
    expectedCategories.forEach(category => {
      const categoryPath = path.join(hugoContentDir, category);
      if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath)
          .filter(file => file.endsWith('.md') && file !== '_index.md')
          .map(file => path.join(categoryPath, file));
        allDocuments.push(...files);
      }
    });

    if (allDocuments.length > 0) {
      fc.assert(fc.property(
        fc.constantFrom(...allDocuments),
        (docPath) => {
          if (!fs.existsSync(docPath)) return false;
          
          const content = fs.readFileSync(docPath, 'utf8');
          const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          
          if (!frontMatterMatch) return false;
          
          const frontMatter = frontMatterMatch[1];
          
          const hasTitle = /title:\s*["']([^"']+)["']/.test(frontMatter);
          const hasCategory = /category:\s*["']([^"']+)["']/.test(frontMatter);
          const hasSummary = /summary:\s*["']([^"']+)["']/.test(frontMatter);
          
          return hasTitle && hasCategory && hasSummary;
        }
      ), { numRuns: Math.min(100, allDocuments.length) });
      console.log('✓ Property test: Document front matter validation');
    }
  } catch (error) {
    console.error('✗ Property test failed: Document front matter', error.message);
  }
}

// Run the tests
console.log('Running Navigation Structure Property Tests...');

// First run property-based tests
runPropertyTests();

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, testFn) {
  testsTotal++;
  try {
    testFn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
  }
}

// Execute tests
runTest('All expected category directories exist', () => {
  expectedCategories.forEach(category => {
    const categoryPath = path.join(hugoContentDir, category);
    const exists = fs.existsSync(categoryPath);
    const isDirectory = exists && fs.statSync(categoryPath).isDirectory();
    
    if (!exists || !isDirectory) {
      throw new Error(`Category directory ${category} does not exist or is not a directory`);
    }
  });
});

runTest('Each category has an index file', () => {
  expectedCategories.forEach(category => {
    const indexPath = path.join(hugoContentDir, category, '_index.md');
    const exists = fs.existsSync(indexPath);
    
    if (!exists) {
      throw new Error(`Index file missing for category ${category}`);
    }
    
    const content = fs.readFileSync(indexPath, 'utf8');
    const hasFrontMatter = content.startsWith('---');
    const hasTitle = content.includes('title:');
    const hasWeight = content.includes('weight:');
    
    if (!hasFrontMatter || !hasTitle || !hasWeight) {
      throw new Error(`Index file for ${category} missing required front matter`);
    }
  });
});

runTest('Hugo taxonomy configuration exists', () => {
  const hugoConfigPath = path.join(__dirname, '..', 'hugo.toml');
  
  if (!fs.existsSync(hugoConfigPath)) {
    throw new Error('Hugo configuration file does not exist');
  }
  
  const config = fs.readFileSync(hugoConfigPath, 'utf8');
  
  const hasTaxonomies = config.includes('[taxonomies]');
  const hasCategories = config.includes('category = "categories"');
  const hasTags = config.includes('tag = "tags"');
  
  if (!hasTaxonomies || !hasCategories || !hasTags) {
    throw new Error('Hugo taxonomy configuration is incomplete');
  }
});

runTest('Document front matter validation (sample)', () => {
  const allDocuments = [];
  
  expectedCategories.forEach(category => {
    const categoryPath = path.join(hugoContentDir, category);
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md') && file !== '_index.md')
        .map(file => path.join(categoryPath, file));
      allDocuments.push(...files);
    }
  });

  // Test a sample of documents
  const sampleSize = Math.min(10, allDocuments.length);
  const sampleDocs = allDocuments.slice(0, sampleSize);
  
  sampleDocs.forEach(docPath => {
    const content = fs.readFileSync(docPath, 'utf8');
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontMatterMatch) {
      throw new Error(`Document ${path.basename(docPath)} missing front matter`);
    }
    
    const frontMatter = frontMatterMatch[1];
    
    const hasTitle = /title:\s*["']([^"']+)["']/.test(frontMatter);
    const hasCategory = /category:\s*["']([^"']+)["']/.test(frontMatter);
    const hasSummary = /summary:\s*["']([^"']+)["']/.test(frontMatter);
    
    if (!hasTitle || !hasCategory || !hasSummary) {
      throw new Error(`Document ${path.basename(docPath)} missing required front matter fields`);
    }
  });
});

// Results
console.log(`\n=== Navigation Structure Test Results ===`);
console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
console.log(`Success rate: ${((testsPassed/testsTotal) * 100).toFixed(1)}%`);

if (testsPassed === testsTotal) {
  console.log('✓ All navigation structure tests passed!');
  process.exit(0);
} else {
  console.log('✗ Some navigation structure tests failed');
  process.exit(1);
}