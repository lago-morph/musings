const fs = require('fs');
const path = require('path');

/**
 * Update Front Matter with Enhanced Titles
 * 
 * Updates existing front matter to use the enhanced titles generated
 * by the enhanced-title-generator.js script
 */

console.log('📝 Updating Front Matter with Enhanced Titles');
console.log('============================================');

// Load enhanced titles results
const enhancedResults = JSON.parse(fs.readFileSync('enhanced-titles-results.json', 'utf8'));

let updatedCount = 0;
let errors = [];

enhancedResults.processed.forEach(doc => {
  if (!doc.enhanced) {
    return; // Skip documents that weren't enhanced
  }
  
  const sourcePath = path.join(__dirname, '..', '..', doc.path);
  
  try {
    // Read the current document
    const content = fs.readFileSync(sourcePath, 'utf8');
    
    // Check if it has front matter
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      const bodyContent = frontMatterMatch[2];
      
      // Update the title in front matter
      const updatedFrontMatter = frontMatter.replace(
        /title:\s*["']([^"']+)["']/,
        `title: "${doc.title}"`
      );
      
      // Write back the updated content
      const updatedContent = `---\n${updatedFrontMatter}\n---\n${bodyContent}`;
      fs.writeFileSync(sourcePath, updatedContent);
      
      console.log(`✓ Updated: ${doc.path}`);
      console.log(`   "${doc.originalTitle}" → "${doc.title}"`);
      updatedCount++;
    } else {
      console.warn(`⚠️  No front matter found in: ${doc.path}`);
    }
    
  } catch (error) {
    const errorMsg = `Failed to update ${doc.path}: ${error.message}`;
    console.error(`✗ ${errorMsg}`);
    errors.push(errorMsg);
  }
});

console.log('\n📊 Update Results:');
console.log(`   Documents updated: ${updatedCount}`);
console.log(`   Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\nErrors encountered:');
  errors.forEach(error => console.log(`   - ${error}`));
}

console.log('\n✅ Front matter title updates complete!');