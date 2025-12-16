const fs = require('fs');
const path = require('path');

/**
 * Copy processed documents with front matter to Hugo content directory
 * Organizes documents by category for better navigation
 */

// Read the front matter results to get processed documents
const frontMatterResults = JSON.parse(fs.readFileSync('front-matter-results.json', 'utf8'));

// Hugo content directory
const hugoContentDir = path.join(__dirname, '..', 'content', 'docs');

// Category mapping for directory organization
const categoryDirs = {
  'AI & Machine Learning': 'ai-ml',
  'Development Platforms': 'devplatform', 
  'Infrastructure': 'infrastructure',
  'Workflows': 'workflows',
  'Miscellaneous': 'misc'
};

// Ensure category directories exist
Object.values(categoryDirs).forEach(dir => {
  const categoryPath = path.join(hugoContentDir, dir);
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }
});

// Function to read front matter from a file
function extractFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontMatterMatch) {
    const frontMatter = frontMatterMatch[1];
    const categoryMatch = frontMatter.match(/category:\s*["']?([^"'\n]+)["']?/);
    if (categoryMatch) {
      const categoryValue = categoryMatch[1].trim();
      // Map category values to directory names
      const categoryMapping = {
        'ai-ml': 'ai-ml',
        'devplatform': 'devplatform',
        'infrastructure': 'infrastructure', 
        'workflows': 'workflows'
      };
      return categoryMapping[categoryValue] || 'misc';
    }
  }
  return 'misc';
}

// Function to create safe filename
function createSafeFilename(originalPath) {
  const basename = path.basename(originalPath, '.md');
  return basename.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') + '.md';
}

// Copy processed documents
let copiedCount = 0;
let errors = [];

console.log('Copying processed documents to Hugo content directory...');

frontMatterResults.processed.forEach(doc => {
  try {
    // Get the full path to the processed document
    const sourcePath = path.join(__dirname, '..', '..', doc.path);
    
    // Extract category from front matter
    const category = extractFrontMatter(sourcePath);
    
    // Use the category directly as the directory name
    const categoryDir = category;
    
    // Create safe filename
    const safeFilename = createSafeFilename(doc.path);
    const targetPath = path.join(hugoContentDir, categoryDir, safeFilename);
    
    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    
    console.log(`✓ Copied: ${doc.path} -> ${categoryDir}/${safeFilename}`);
    copiedCount++;
    
  } catch (error) {
    const errorMsg = `Failed to copy ${doc.path}: ${error.message}`;
    console.error(`✗ ${errorMsg}`);
    errors.push(errorMsg);
  }
});

// Create category index pages
Object.entries(categoryDirs).forEach(([categoryName, categoryDir]) => {
  const indexPath = path.join(hugoContentDir, categoryDir, '_index.md');
  const indexContent = `---
title: "${categoryName}"
weight: ${Object.keys(categoryDirs).indexOf(categoryName) + 1}
---

# ${categoryName}

Browse all documents in the ${categoryName} category.
`;
  
  fs.writeFileSync(indexPath, indexContent);
  console.log(`✓ Created category index: ${categoryDir}/_index.md`);
});

// Results summary
console.log('\n=== Copy Results ===');
console.log(`Successfully copied: ${copiedCount} documents`);
console.log(`Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\nErrors encountered:');
  errors.forEach(error => console.log(`  - ${error}`));
}

// Save results
const results = {
  timestamp: new Date().toISOString(),
  copiedCount,
  errors,
  categoryDirs
};

fs.writeFileSync('copy-results.json', JSON.stringify(results, null, 2));
console.log('\nResults saved to copy-results.json');