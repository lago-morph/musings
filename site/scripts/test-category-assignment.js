const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Property-Based Test for Category Assignment
 * 
 * **Feature: hugo-docs-site, Property 8: Category Assignment Consistency**
 * **Validates: Requirements 3.4**
 * 
 * Tests that every processed document is assigned to exactly one of the 4-5 main categories
 * based on content analysis, ensuring consistent categorization across all documents.
 */

console.log('🧪 Property Test: Category Assignment Consistency');
console.log('================================================');

// Load the category assignment results
const SCRIPTS_DIR = __dirname;
let analysisResults;

try {
  analysisResults = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, 'analysis-results.json'), 'utf8'));
} catch (error) {
  console.error('✗ Could not load analysis results. Run content analysis first.');
  process.exit(1);
}

const documents = analysisResults.documents || [];

// Define the expected categories based on our content analysis
const EXPECTED_CATEGORIES = [
  'ai-ml',
  'devplatform', 
  'infrastructure',
  'workflows'
];

// Property 8: Category Assignment Consistency
// For any processed document, it should be assigned to exactly one of the 4-5 main categories
const categoryAssignmentProperty = fc.property(
  fc.constantFrom(...documents),
  (document) => {
    // Each document must have a category field
    const hasCategory = document.hasOwnProperty('category');
    if (!hasCategory) {
      return false;
    }

    // Category must be one of the expected categories
    const isValidCategory = EXPECTED_CATEGORIES.includes(document.category);
    if (!isValidCategory) {
      return false;
    }

    // Category must be a non-empty string
    const isNonEmptyString = typeof document.category === 'string' && document.category.length > 0;
    if (!isNonEmptyString) {
      return false;
    }

    return true;
  }
);

// Additional property: Category distribution should be reasonable
// No single category should contain more than 80% of all documents
const categoryDistributionProperty = fc.property(
  fc.constant(documents),
  (allDocuments) => {
    const categoryCount = {};
    
    // Count documents per category
    allDocuments.forEach(doc => {
      if (doc.category) {
        categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1;
      }
    });
    
    const totalDocuments = allDocuments.length;
    
    // Check that no category has more than 80% of documents
    for (const [category, count] of Object.entries(categoryCount)) {
      const percentage = count / totalDocuments;
      if (percentage > 0.8) {
        return false;
      }
    }
    
    // Check that all expected categories are represented (unless we have very few documents)
    if (totalDocuments >= 4) {
      const representedCategories = Object.keys(categoryCount);
      const missingCategories = EXPECTED_CATEGORIES.filter(cat => !representedCategories.includes(cat));
      
      // Allow up to 1 missing category for flexibility
      if (missingCategories.length > 1) {
        return false;
      }
    }
    
    return true;
  }
);

// Property: Category names should follow naming convention
const categoryNamingProperty = fc.property(
  fc.constantFrom(...documents),
  (document) => {
    if (!document.category) return false;
    
    // Category names should be lowercase with hyphens
    const isValidNaming = /^[a-z]+(-[a-z]+)*$/.test(document.category);
    return isValidNaming;
  }
);

// Run the property tests
console.log('\n🔍 Running Property Tests...');

let allTestsPassed = true;

try {
  console.log('\n📋 Test 1: Category Assignment Consistency');
  console.log('   Testing that each document has exactly one valid category...');
  
  fc.assert(categoryAssignmentProperty, { 
    numRuns: Math.min(documents.length * 2, 200),
    verbose: false 
  });
  
  console.log('   ✓ All documents have valid category assignments');
  
} catch (error) {
  console.error('   ✗ Category assignment test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📊 Test 2: Category Distribution Balance');
  console.log('   Testing that category distribution is reasonable...');
  
  fc.assert(categoryDistributionProperty, { 
    numRuns: 10,
    verbose: false 
  });
  
  console.log('   ✓ Category distribution is balanced');
  
} catch (error) {
  console.error('   ✗ Category distribution test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🏷️  Test 3: Category Naming Convention');
  console.log('   Testing that category names follow naming convention...');
  
  fc.assert(categoryNamingProperty, { 
    numRuns: Math.min(documents.length * 2, 200),
    verbose: false 
  });
  
  console.log('   ✓ All category names follow naming convention');
  
} catch (error) {
  console.error('   ✗ Category naming test failed:', error.message);
  allTestsPassed = false;
}

// Display category statistics
console.log('\n📈 Category Statistics:');
const categoryStats = {};
documents.forEach(doc => {
  if (doc.category) {
    categoryStats[doc.category] = (categoryStats[doc.category] || 0) + 1;
  }
});

Object.entries(categoryStats)
  .sort(([,a], [,b]) => b - a)
  .forEach(([category, count]) => {
    const percentage = ((count / documents.length) * 100).toFixed(1);
    console.log(`   ${category}: ${count} documents (${percentage}%)`);
  });

console.log(`\n📊 Total: ${documents.length} documents across ${Object.keys(categoryStats).length} categories`);

// Final result
if (allTestsPassed) {
  console.log('\n✅ All category assignment property tests passed!');
  console.log('   Category assignment is consistent and follows requirements.');
  process.exit(0);
} else {
  console.log('\n❌ Some category assignment tests failed!');
  console.log('   Review the category assignment logic and try again.');
  process.exit(1);
}