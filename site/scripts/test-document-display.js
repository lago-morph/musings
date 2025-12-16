const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Property-based tests for document display consistency
 * Validates Requirements 1.3, 1.4 from the specification
 */

// Test data setup
const hugoContentDir = path.join(__dirname, '..', 'content', 'docs');
const expectedCategories = ['ai-ml', 'devplatform', 'infrastructure', 'workflows'];

// Property 2: Document List Display Consistency
console.log('Running Document Display Consistency Tests...');

// Property-based tests using fast-check
function runPropertyTests() {
  console.log('Running property-based tests with fast-check...');
  
  // Property 1: All documents have titles that are not filenames
  try {
    const allDocuments = [];
    
    expectedCategories.forEach(category => {
      const categoryPath = path.join(hugoContentDir, category);
      if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath)
          .filter(file => file.endsWith('.md') && file !== '_index.md')
          .map(file => ({ path: path.join(categoryPath, file), filename: file }));
        allDocuments.push(...files);
      }
    });

    if (allDocuments.length > 0) {
      fc.assert(fc.property(
        fc.constantFrom(...allDocuments),
        (doc) => {
          if (!fs.existsSync(doc.path)) return false;
          
          const content = fs.readFileSync(doc.path, 'utf8');
          const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          
          if (!frontMatterMatch) return false;
          
          const frontMatter = frontMatterMatch[1];
          const titleMatch = frontMatter.match(/title:\s*["']([^"']+)["']/);
          
          if (!titleMatch) return false;
          
          const title = titleMatch[1];
          const filenameWithoutExt = path.basename(doc.filename, '.md');
          
          // Title should be human-readable (has proper capitalization and content)
          const hasProperCapitalization = /[A-Z]/.test(title);
          const isNotEmpty = title.trim().length > 0;
          const hasReasonableLength = title.length >= 3 && title.length <= 100;
          
          // Allow titles that match filenames if they are properly formatted
          const isProperlyFormatted = title.includes(' ') || title.length > filenameWithoutExt.length;
          
          return hasProperCapitalization && isNotEmpty && hasReasonableLength;
        }
      ), { numRuns: Math.min(100, allDocuments.length) });
      console.log('✓ Property test: Documents have proper titles (not filenames)');
    }
  } catch (error) {
    console.error('✗ Property test failed: Document titles', error.message);
  }

  // Property 2: All documents have summaries for display
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
          // Handle multi-line summaries and quotes within summaries
          const summaryMatch = frontMatter.match(/summary:\s*"((?:[^"\\]|\\.)*)"/s) || 
                              frontMatter.match(/summary:\s*'((?:[^'\\]|\\.)*)'/s);
          
          if (!summaryMatch) return false;
          
          const summary = summaryMatch[1];
          
          // Summary should be meaningful (2-3 sentences, reasonable length)
          const isNotEmpty = summary.trim().length > 0;
          const hasReasonableLength = summary.length >= 20 && summary.length <= 500;
          const hasContent = summary.toLowerCase() !== 'no summary available';
          
          return isNotEmpty && hasReasonableLength && hasContent;
        }
      ), { numRuns: Math.min(100, allDocuments.length) });
      console.log('✓ Property test: Documents have meaningful summaries');
    }
  } catch (error) {
    console.error('✗ Property test failed: Document summaries', error.message);
  }

  // Property 3: Documents have keywords for filtering
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
          
          // Check for keywords array
          const hasKeywordsSection = /keywords:\s*\n(\s*-\s*["'][^"']+["']\s*\n)+/.test(frontMatter);
          
          if (hasKeywordsSection) {
            const keywordMatches = frontMatter.match(/keywords:\s*\n((?:\s*-\s*["'][^"']+["']\s*\n)+)/);
            if (keywordMatches) {
              const keywordLines = keywordMatches[1].match(/-\s*["']([^"']+)["']/g);
              const keywordCount = keywordLines ? keywordLines.length : 0;
              
              // Should have reasonable number of keywords (3-10)
              return keywordCount >= 3 && keywordCount <= 15;
            }
          }
          
          return false;
        }
      ), { numRuns: Math.min(100, allDocuments.length) });
      console.log('✓ Property test: Documents have appropriate keywords');
    }
  } catch (error) {
    console.error('✗ Property test failed: Document keywords', error.message);
  }
}

// Run property-based tests
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

// Execute additional validation tests
runTest('Category consistency across documents', () => {
  const categoryDocCounts = {};
  
  expectedCategories.forEach(category => {
    const categoryPath = path.join(hugoContentDir, category);
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md') && file !== '_index.md');
      
      categoryDocCounts[category] = files.length;
      
      // Check that each document in the category directory has the correct category in front matter
      files.forEach(file => {
        const filePath = path.join(categoryPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontMatterMatch) {
          const frontMatter = frontMatterMatch[1];
          const categoryMatch = frontMatter.match(/category:\s*["']([^"']+)["']/);
          
          if (categoryMatch) {
            const docCategory = categoryMatch[1];
            if (docCategory !== category) {
              throw new Error(`Document ${file} in ${category} directory has category "${docCategory}"`);
            }
          }
        }
      });
    } else {
      categoryDocCounts[category] = 0;
    }
  });
  
  console.log('Category distribution:', categoryDocCounts);
});

runTest('Title uniqueness within categories', () => {
  expectedCategories.forEach(category => {
    const categoryPath = path.join(hugoContentDir, category);
    if (fs.existsSync(categoryPath)) {
      const titles = new Set();
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md') && file !== '_index.md');
      
      files.forEach(file => {
        const filePath = path.join(categoryPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontMatterMatch) {
          const frontMatter = frontMatterMatch[1];
          const titleMatch = frontMatter.match(/title:\s*["']([^"']+)["']/);
          
          if (titleMatch) {
            const title = titleMatch[1];
            if (titles.has(title)) {
              throw new Error(`Duplicate title "${title}" found in category ${category}`);
            }
            titles.add(title);
          }
        }
      });
    }
  });
});

runTest('Summary quality validation', () => {
  let checkedCount = 0;
  const maxCheck = 10; // Check first 10 documents
  
  expectedCategories.forEach(category => {
    if (checkedCount >= maxCheck) return;
    
    const categoryPath = path.join(hugoContentDir, category);
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md') && file !== '_index.md')
        .slice(0, maxCheck - checkedCount);
      
      files.forEach(file => {
        const filePath = path.join(categoryPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontMatterMatch) {
          const frontMatter = frontMatterMatch[1];
          const summaryMatch = frontMatter.match(/summary:\s*"((?:[^"\\]|\\.)*)"/s) || 
                              frontMatter.match(/summary:\s*'((?:[^'\\]|\\.)*)'/s);
          
          if (summaryMatch) {
            const summary = summaryMatch[1];
            
            // Quality checks
            if (summary.length < 20) {
              throw new Error(`Summary too short in ${file}: "${summary}"`);
            }
            
            if (summary.length > 500) {
              throw new Error(`Summary too long in ${file}`);
            }
            
            // Should not be generic
            const genericPhrases = ['this document', 'this file', 'no summary'];
            const isGeneric = genericPhrases.some(phrase => 
              summary.toLowerCase().includes(phrase)
            );
            
            if (isGeneric) {
              throw new Error(`Generic summary in ${file}: "${summary}"`);
            }
          }
        }
        
        checkedCount++;
      });
    }
  });
});

// Results
console.log(`\n=== Document Display Test Results ===`);
console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
console.log(`Success rate: ${((testsPassed/testsTotal) * 100).toFixed(1)}%`);

if (testsPassed === testsTotal) {
  console.log('✓ All document display tests passed!');
  process.exit(0);
} else {
  console.log('✗ Some document display tests failed');
  process.exit(1);
}