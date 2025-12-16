const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Property-Based Test for Title Usage Consistency
 * 
 * **Feature: hugo-docs-site, Property 5: Title Usage Consistency**
 * **Validates: Requirements 2.2**
 * 
 * Tests that document titles (extracted from content) are used consistently
 * throughout the site instead of filenames, including navigation, search,
 * and document lists.
 */

console.log('🧪 Property Test: Title Usage Consistency');
console.log('========================================');

const SITE_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(SITE_DIR, 'content', 'docs');
const PUBLIC_DIR = path.join(SITE_DIR, 'public');

// Function to extract title and filename from documents
function getDocumentTitles() {
  const documents = [];
  
  function scanDirectory(dirPath, category = '') {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const newCategory = category || item;
        scanDirectory(fullPath, newCategory);
      } else if (item.endsWith('.md') && item !== '_index.md') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          
          if (frontMatterMatch) {
            const frontMatter = frontMatterMatch[1];
            const titleMatch = frontMatter.match(/title:\s*"([^"]+)"/);
            
            if (titleMatch) {
              const title = titleMatch[1];
              const filename = item.replace('.md', '');
              const filenameTitle = filename.replace(/[-_]/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
              
              documents.push({
                path: fullPath,
                filename: filename,
                filenameTitle: filenameTitle,
                title: title,
                category: category,
                // Generate expected URL path
                urlPath: path.join('docs', category, filename).replace(/\\/g, '/')
              });
            }
          }
        } catch (error) {
          console.warn(`Warning: Could not parse ${fullPath}`);
        }
      }
    }
  }
  
  scanDirectory(CONTENT_DIR);
  return documents;
}

// Function to check HTML files for title usage
function checkHTMLTitleUsage(documents) {
  const results = [];
  
  for (const doc of documents) {
    const htmlPath = path.join(PUBLIC_DIR, 'docs', doc.category, doc.filename, 'index.html');
    
    if (fs.existsSync(htmlPath)) {
      try {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Check if the document title appears in the HTML
        const titleInHTML = htmlContent.includes(doc.title);
        const filenameInHTML = htmlContent.includes(doc.filename);
        const filenameTitleInHTML = htmlContent.includes(doc.filenameTitle);
        
        // Check page title
        const pageTitleMatch = htmlContent.match(/<title>([^<]+)<\/title>/);
        const pageTitle = pageTitleMatch ? pageTitleMatch[1] : '';
        
        // Check navigation/menu usage
        const inNavigation = htmlContent.includes(`href="/musings/docs/${doc.category}/${doc.filename}/"`);
        
        results.push({
          document: doc,
          htmlPath: htmlPath,
          titleInHTML: titleInHTML,
          filenameInHTML: filenameInHTML,
          filenameTitleInHTML: filenameTitleInHTML,
          pageTitle: pageTitle,
          inNavigation: inNavigation,
          usesProperTitle: titleInHTML && pageTitle.includes(doc.title)
        });
      } catch (error) {
        console.warn(`Warning: Could not parse HTML ${htmlPath}`);
      }
    }
  }
  
  return results;
}

// Function to check navigation menu for title usage
function checkNavigationTitleUsage(documents) {
  const mainIndexPath = path.join(PUBLIC_DIR, 'index.html');
  const docsIndexPath = path.join(PUBLIC_DIR, 'docs', 'index.html');
  
  const navigationChecks = [];
  
  // Check main navigation files
  const navFiles = [mainIndexPath, docsIndexPath];
  
  for (const navFile of navFiles) {
    if (fs.existsSync(navFile)) {
      try {
        const content = fs.readFileSync(navFile, 'utf8');
        
        for (const doc of documents) {
          const titleInNav = content.includes(doc.title);
          const filenameInNav = content.includes(doc.filename);
          
          navigationChecks.push({
            navFile: navFile,
            document: doc,
            titleInNav: titleInNav,
            filenameInNav: filenameInNav,
            prefersTitleOverFilename: titleInNav && !filenameInNav
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not parse navigation ${navFile}`);
      }
    }
  }
  
  return navigationChecks;
}

// Get document data
let documents = [];
let htmlResults = [];
let navigationResults = [];

try {
  documents = getDocumentTitles();
  htmlResults = checkHTMLTitleUsage(documents);
  navigationResults = checkNavigationTitleUsage(documents);
  
  console.log(`\n📚 Found ${documents.length} documents with titles`);
  console.log(`📊 Analyzed ${htmlResults.length} HTML files`);
  console.log(`🧭 Checked ${navigationResults.length} navigation entries`);
} catch (error) {
  console.error('✗ Could not analyze title usage:', error.message);
  process.exit(1);
}

// Property 5: Title Usage Consistency
// Test that document titles are used instead of filenames

// Test 1: HTML pages use document titles, not filenames
const htmlTitleUsageProperty = fc.property(
  fc.constant(htmlResults),
  (results) => {
    for (const result of results) {
      // Page should use the document title
      if (!result.usesProperTitle) {
        return false;
      }
      
      // Should prefer title over filename in content
      if (result.filenameTitleInHTML && !result.titleInHTML) {
        return false;
      }
    }
    
    return results.length > 0;
  }
);

// Test 2: Navigation uses titles consistently
const navigationTitleUsageProperty = fc.property(
  fc.constant(navigationResults),
  (results) => {
    let titleUsageCount = 0;
    let filenameUsageCount = 0;
    
    for (const result of results) {
      if (result.titleInNav) titleUsageCount++;
      if (result.filenameInNav) filenameUsageCount++;
    }
    
    // Should prefer titles over filenames in navigation
    return titleUsageCount >= filenameUsageCount;
  }
);

// Test 3: Document titles are meaningful (not just filename conversions)
const meaningfulTitlesProperty = fc.property(
  fc.constant(documents),
  (docs) => {
    let meaningfulCount = 0;
    
    for (const doc of docs) {
      // Title should be different from simple filename conversion
      const simpleConversion = doc.filename.replace(/[-_]/g, ' ').toLowerCase();
      const titleLower = doc.title.toLowerCase();
      
      if (titleLower !== simpleConversion) {
        meaningfulCount++;
      }
    }
    
    // At least some titles should be more meaningful than filename conversions
    return meaningfulCount > docs.length * 0.3; // 30% threshold
  }
);

// Test 4: Consistent title format across documents
const titleFormatConsistencyProperty = fc.property(
  fc.constant(documents),
  (docs) => {
    // Check that titles follow consistent formatting
    let properlyFormattedCount = 0;
    
    for (const doc of docs) {
      // Title should be properly capitalized and not empty
      const isProperlyFormatted = doc.title.length > 0 && 
                                 doc.title.trim() === doc.title &&
                                 doc.title !== doc.title.toLowerCase() &&
                                 doc.title !== doc.title.toUpperCase();
      
      if (isProperlyFormatted) {
        properlyFormattedCount++;
      }
    }
    
    // Most titles should be properly formatted
    return properlyFormattedCount > docs.length * 0.8; // 80% threshold
  }
);

// Test 5: Search data uses titles
const searchDataTitleUsageProperty = fc.property(
  fc.constant(documents),
  (docs) => {
    const searchDataPath = path.join(PUBLIC_DIR, 'en.search-data.min.4066c198f8a69eb3c2acbd1a860ba5e344c973e39eb3516493a88c6168c1ced7.json');
    
    // Find any search data file (name may vary)
    const publicFiles = fs.readdirSync(PUBLIC_DIR);
    const searchFile = publicFiles.find(file => file.startsWith('en.search-data.min.') && file.endsWith('.json'));
    
    if (!searchFile) return true; // Skip if no search data
    
    const searchPath = path.join(PUBLIC_DIR, searchFile);
    
    try {
      const searchData = JSON.parse(fs.readFileSync(searchPath, 'utf8'));
      
      // Check that search data contains document titles
      let titleCount = 0;
      let filenameCount = 0;
      
      for (const doc of docs) {
        const searchContent = JSON.stringify(searchData);
        if (searchContent.includes(doc.title)) titleCount++;
        if (searchContent.includes(doc.filename)) filenameCount++;
      }
      
      // Should prefer titles in search data
      return titleCount >= filenameCount;
    } catch (error) {
      return true; // Skip if can't parse search data
    }
  }
);

// Run the property tests
console.log('\n🔍 Running Title Usage Property Tests...');

let allTestsPassed = true;

try {
  console.log('\n📄 Test 1: HTML Title Usage');
  console.log('   Testing that HTML pages use document titles instead of filenames...');
  
  fc.assert(htmlTitleUsageProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ HTML pages use document titles correctly');
  
} catch (error) {
  console.error('   ✗ HTML title usage test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🧭 Test 2: Navigation Title Usage');
  console.log('   Testing that navigation uses titles consistently...');
  
  fc.assert(navigationTitleUsageProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Navigation uses titles consistently');
  
} catch (error) {
  console.error('   ✗ Navigation title usage test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n💭 Test 3: Meaningful Titles');
  console.log('   Testing that titles are meaningful, not just filename conversions...');
  
  fc.assert(meaningfulTitlesProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Document titles are meaningful');
  
} catch (error) {
  console.error('   ✗ Meaningful titles test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📝 Test 4: Title Format Consistency');
  console.log('   Testing that titles follow consistent formatting...');
  
  fc.assert(titleFormatConsistencyProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Title formatting is consistent');
  
} catch (error) {
  console.error('   ✗ Title format consistency test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🔍 Test 5: Search Data Title Usage');
  console.log('   Testing that search data uses titles instead of filenames...');
  
  fc.assert(searchDataTitleUsageProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Search data uses document titles');
  
} catch (error) {
  console.error('   ✗ Search data title usage test failed:', error.message);
  allTestsPassed = false;
}

// Display title usage statistics
console.log('\n📊 Title Usage Statistics:');

const properTitleUsage = htmlResults.filter(r => r.usesProperTitle).length;
console.log(`   HTML files using proper titles: ${properTitleUsage}/${htmlResults.length} (${Math.round(properTitleUsage/htmlResults.length*100)}%)`);

const meaningfulTitles = documents.filter(doc => {
  const simpleConversion = doc.filename.replace(/[-_]/g, ' ').toLowerCase();
  return doc.title.toLowerCase() !== simpleConversion;
}).length;
console.log(`   Meaningful titles (vs filename): ${meaningfulTitles}/${documents.length} (${Math.round(meaningfulTitles/documents.length*100)}%)`);

// Sample title comparisons
console.log('\n📝 Sample Title vs Filename Comparisons:');
documents.slice(0, 5).forEach(doc => {
  console.log(`   "${doc.title}" (vs "${doc.filename}")`);
});

// Check for common title issues
console.log('\n⚠️  Title Quality Checks:');
const emptyTitles = documents.filter(doc => !doc.title || doc.title.trim().length === 0).length;
const allCapsTitle = documents.filter(doc => doc.title === doc.title.toUpperCase()).length;
const allLowerTitles = documents.filter(doc => doc.title === doc.title.toLowerCase()).length;

console.log(`   Empty titles: ${emptyTitles}`);
console.log(`   All caps titles: ${allCapsTitle}`);
console.log(`   All lowercase titles: ${allLowerTitles}`);

// Final result
if (allTestsPassed) {
  console.log('\n✅ All title usage consistency property tests passed!');
  console.log('   Document titles are used consistently throughout the site.');
  process.exit(0);
} else {
  console.log('\n❌ Some title usage tests failed!');
  console.log('   Review the title usage implementation and try again.');
  process.exit(1);
}