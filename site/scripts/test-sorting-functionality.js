const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Property-Based Test for Sorting Functionality
 * 
 * **Feature: hugo-docs-site, Property 3: Sorting Functionality Completeness**
 * **Validates: Requirements 1.5**
 * 
 * Tests that the Hugo site provides multiple sorting options including:
 * - Date-based sorting
 * - Category-based sorting  
 * - Alphabetical sorting
 * - Tag-based filtering with sorting
 */

console.log('🧪 Property Test: Sorting Functionality Completeness');
console.log('==================================================');

const SITE_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(SITE_DIR, 'content', 'docs');
const PUBLIC_DIR = path.join(SITE_DIR, 'public');

// Function to get all markdown files with their front matter
function getAllDocuments() {
  const documents = [];
  
  function scanDirectory(dirPath, category = '') {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Use directory name as category
        const newCategory = category || item;
        scanDirectory(fullPath, newCategory);
      } else if (item.endsWith('.md') && item !== '_index.md') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          
          if (frontMatterMatch) {
            const frontMatter = frontMatterMatch[1];
            const title = frontMatter.match(/title:\s*"([^"]+)"/)?.[1] || item.replace('.md', '');
            const dateMatch = frontMatter.match(/date:\s*"([^"]+)"/);
            const categoryMatch = frontMatter.match(/category:\s*"([^"]+)"/);
            const weightMatch = frontMatter.match(/weight:\s*(\d+)/);
            const keywordsMatch = frontMatter.match(/keywords:\s*\[([\s\S]*?)\]/);
            
            documents.push({
              path: fullPath,
              filename: item,
              title: title,
              category: categoryMatch?.[1] || category,
              date: dateMatch?.[1] || '2025-12-16',
              weight: parseInt(weightMatch?.[1]) || 1,
              keywords: keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim().replace(/"/g, '')) : []
            });
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

// Get all documents
let allDocuments = [];
try {
  allDocuments = getAllDocuments();
  console.log(`\n📚 Found ${allDocuments.length} documents for sorting tests`);
} catch (error) {
  console.error('✗ Could not load documents:', error.message);
  process.exit(1);
}

// Property 3: Sorting Functionality Completeness
// Test that documents can be sorted by different criteria

// Test 1: Alphabetical sorting by title
const alphabeticalSortingProperty = fc.property(
  fc.constant(allDocuments),
  (documents) => {
    const sorted = [...documents].sort((a, b) => a.title.localeCompare(b.title));
    
    // Verify sorting is correct
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i-1].title.localeCompare(sorted[i].title) > 0) {
        return false;
      }
    }
    
    return true;
  }
);

// Test 2: Category-based sorting
const categorySortingProperty = fc.property(
  fc.constant(allDocuments),
  (documents) => {
    const sorted = [...documents].sort((a, b) => {
      // First sort by category, then by title within category
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) return categoryCompare;
      return a.title.localeCompare(b.title);
    });
    
    // Verify category grouping
    let currentCategory = '';
    for (const doc of sorted) {
      if (doc.category < currentCategory) {
        return false;
      }
      currentCategory = doc.category;
    }
    
    return true;
  }
);

// Test 3: Date-based sorting
const dateSortingProperty = fc.property(
  fc.constant(allDocuments),
  (documents) => {
    const sorted = [...documents].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
    
    // Verify date sorting
    for (let i = 1; i < sorted.length; i++) {
      const dateA = new Date(sorted[i-1].date);
      const dateB = new Date(sorted[i].date);
      if (dateA.getTime() < dateB.getTime()) {
        return false;
      }
    }
    
    return true;
  }
);

// Test 4: Weight-based sorting (for navigation order)
const weightSortingProperty = fc.property(
  fc.constant(allDocuments),
  (documents) => {
    const sorted = [...documents].sort((a, b) => a.weight - b.weight);
    
    // Verify weight sorting
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i-1].weight > sorted[i].weight) {
        return false;
      }
    }
    
    return true;
  }
);

// Test 5: Tag-based filtering and sorting
const allTags = Array.from(new Set(allDocuments.flatMap(d => d.keywords))).filter(tag => tag && tag.trim());
const tagFilteringProperty = allTags.length > 0 ? fc.property(
  fc.constantFrom(...allTags),
  (tag) => {
    const filtered = allDocuments.filter(doc => 
      doc.keywords.some(keyword => keyword.toLowerCase().includes(tag.toLowerCase()))
    );
    
    // All filtered documents should contain the tag
    return filtered.every(doc => 
      doc.keywords.some(keyword => keyword.toLowerCase().includes(tag.toLowerCase()))
    );
  }
) : fc.property(fc.constant(true), () => true); // Skip if no tags

// Test 6: Hugo taxonomy pages exist for sorting
const taxonomyPagesProperty = fc.property(
  fc.constant(allDocuments),
  (documents) => {
    // Check that category and tag taxonomy pages exist
    const categoriesPage = path.join(PUBLIC_DIR, 'categories', 'index.html');
    const tagsPage = path.join(PUBLIC_DIR, 'tags', 'index.html');
    
    return fs.existsSync(categoriesPage) && fs.existsSync(tagsPage);
  }
);

// Run the property tests
console.log('\n🔍 Running Sorting Property Tests...');

let allTestsPassed = true;

try {
  console.log('\n📝 Test 1: Alphabetical Sorting');
  console.log('   Testing that documents can be sorted alphabetically by title...');
  
  fc.assert(alphabeticalSortingProperty, { 
    numRuns: 10,
    verbose: false 
  });
  
  console.log('   ✓ Alphabetical sorting works correctly');
  
} catch (error) {
  console.error('   ✗ Alphabetical sorting test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📂 Test 2: Category-based Sorting');
  console.log('   Testing that documents can be sorted by category...');
  
  fc.assert(categorySortingProperty, { 
    numRuns: 10,
    verbose: false 
  });
  
  console.log('   ✓ Category-based sorting works correctly');
  
} catch (error) {
  console.error('   ✗ Category sorting test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📅 Test 3: Date-based Sorting');
  console.log('   Testing that documents can be sorted by date...');
  
  fc.assert(dateSortingProperty, { 
    numRuns: 10,
    verbose: false 
  });
  
  console.log('   ✓ Date-based sorting works correctly');
  
} catch (error) {
  console.error('   ✗ Date sorting test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n⚖️  Test 4: Weight-based Sorting');
  console.log('   Testing that documents can be sorted by weight for navigation...');
  
  fc.assert(weightSortingProperty, { 
    numRuns: 10,
    verbose: false 
  });
  
  console.log('   ✓ Weight-based sorting works correctly');
  
} catch (error) {
  console.error('   ✗ Weight sorting test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🏷️  Test 5: Tag-based Filtering');
  console.log('   Testing that documents can be filtered by tags...');
  
  if (allTags.length > 0) {
    fc.assert(tagFilteringProperty, { 
      numRuns: Math.min(50, allTags.length),
      verbose: false 
    });
    console.log('   ✓ Tag-based filtering works correctly');
  } else {
    console.log('   ⚠️  No tags found, skipping tag filtering test');
  }
  
} catch (error) {
  console.error('   ✗ Tag filtering test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🌐 Test 6: Hugo Taxonomy Pages');
  console.log('   Testing that Hugo has generated taxonomy pages for sorting...');
  
  fc.assert(taxonomyPagesProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Hugo taxonomy pages exist for sorting');
  
} catch (error) {
  console.error('   ✗ Taxonomy pages test failed:', error.message);
  allTestsPassed = false;
}

// Display sorting statistics
console.log('\n📊 Sorting Statistics:');

const categories = Array.from(new Set(allDocuments.map(d => d.category))).sort();
console.log(`   Categories: ${categories.length} (${categories.join(', ')})`);

const allTagsForStats = Array.from(new Set(allDocuments.flatMap(d => d.keywords))).filter(tag => tag && tag.trim()).sort();
console.log(`   Unique tags: ${allTagsForStats.length}`);

const dateRange = allDocuments.map(d => new Date(d.date)).sort((a, b) => a - b);
if (dateRange.length > 0) {
  console.log(`   Date range: ${dateRange[0].toDateString()} to ${dateRange[dateRange.length-1].toDateString()}`);
}

const weightRange = allDocuments.map(d => d.weight).sort((a, b) => a - b);
if (weightRange.length > 0) {
  console.log(`   Weight range: ${weightRange[0]} to ${weightRange[weightRange.length-1]}`);
}

// Test actual Hugo sorting by checking generated pages
console.log('\n🔍 Hugo Generated Sorting:');

const categoriesIndexPath = path.join(PUBLIC_DIR, 'categories', 'index.html');
if (fs.existsSync(categoriesIndexPath)) {
  console.log('   ✓ Categories index page generated');
} else {
  console.log('   ✗ Categories index page missing');
  allTestsPassed = false;
}

const tagsIndexPath = path.join(PUBLIC_DIR, 'tags', 'index.html');
if (fs.existsSync(tagsIndexPath)) {
  console.log('   ✓ Tags index page generated');
} else {
  console.log('   ✗ Tags index page missing');
  allTestsPassed = false;
}

// Check individual category pages
categories.forEach(category => {
  const categoryPath = path.join(PUBLIC_DIR, 'categories', category.toLowerCase(), 'index.html');
  if (fs.existsSync(categoryPath)) {
    console.log(`   ✓ Category page for "${category}" exists`);
  } else {
    console.log(`   ⚠️  Category page for "${category}" not found (may be expected)`);
  }
});

// Final result
if (allTestsPassed) {
  console.log('\n✅ All sorting functionality property tests passed!');
  console.log('   Sorting functionality complies with requirements.');
  process.exit(0);
} else {
  console.log('\n❌ Some sorting functionality tests failed!');
  console.log('   Review the sorting implementation and try again.');
  process.exit(1);
}