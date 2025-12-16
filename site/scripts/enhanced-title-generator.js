const fs = require('fs');
const path = require('path');

/**
 * Enhanced Title Generator
 * 
 * Analyzes document content to generate descriptive, contextual titles
 * instead of generic ones like "Overview" or "Core Concepts"
 */

// Load existing analysis results
const analysisResults = JSON.parse(fs.readFileSync('analysis-results.json', 'utf8'));
const documents = analysisResults.documents || [];

console.log('🏷️  Enhanced Title Generation');
console.log('============================');

// Generic titles that need enhancement
const genericTitles = [
  'overview', 'introduction', 'getting started', 'core concepts', 
  'recommendations', 'summary', 'guide', 'tutorial', 'basics',
  'fundamentals', 'primer', 'walkthrough', 'quickstart', 'setup',
  'configuration', 'installation', 'deployment', 'implementation',
  'architecture', 'design', 'patterns', 'best practices', 'tips',
  'tricks', 'examples', 'samples', 'demo', 'test', 'proof of concept',
  'poc', 'prototype', 'draft', 'notes', 'thoughts', 'ideas',
  'export conversion', 'stage1', 'stage2', 'stage3', 'tasks',
  'prompt', 'shell script helper', 'pseudocode', 'example stage',
  'fast-moving image warehouse', 'read current state'
];

function isGenericTitle(title) {
  const normalized = title.toLowerCase().trim();
  return genericTitles.some(generic => 
    normalized === generic || 
    normalized.startsWith(generic + ':') ||
    normalized.startsWith(generic + ' -') ||
    normalized.endsWith(' ' + generic)
  );
}

function extractContextFromPath(filePath) {
  const pathParts = filePath.split(/[/\\]/);
  const contexts = [];
  
  // Extract meaningful context from path
  pathParts.forEach(part => {
    if (part && !part.endsWith('.md')) {
      // Convert kebab-case and snake_case to readable format
      const readable = part
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      contexts.push(readable);
    }
  });
  
  return contexts;
}

function generateEnhancedTitle(doc) {
  const { path: filePath, title: originalTitle } = doc;
  
  // Read the actual document content
  const fullPath = path.join(__dirname, '..', '..', filePath);
  let content = '';
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.warn(`Could not read ${filePath}: ${error.message}`);
    return originalTitle;
  }
  
  // If title is already good, keep it
  if (!isGenericTitle(originalTitle) && originalTitle.length > 10) {
    return originalTitle;
  }
  
  console.log(`\n🔍 Enhancing title for: ${filePath}`);
  console.log(`   Original: "${originalTitle}"`);
  
  // Extract context from file path
  const pathContexts = extractContextFromPath(filePath);
  
  // Look for the first meaningful header in the document
  const lines = content.split('\n');
  let enhancedTitle = originalTitle;
  
  // Strategy 1: Find the first substantial header (not just #)
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i].trim();
    
    // Look for headers that aren't generic
    if (line.startsWith('#')) {
      const headerText = line.replace(/^#+\s*/, '').trim();
      if (headerText.length > 5 && !isGenericTitle(headerText)) {
        enhancedTitle = headerText;
        break;
      }
    }
  }
  
  // Strategy 2: If still generic, look for meaningful content patterns
  if (enhancedTitle === originalTitle || isGenericTitle(enhancedTitle)) {
    const contentLower = content.toLowerCase();
    
    // Look for comparison patterns
    const vsPatterns = [
      /(\w+)\s+vs\.?\s+(\w+)/i,
      /(\w+)\s+versus\s+(\w+)/i,
      /comparing\s+(\w+)\s+(?:and|with)\s+(\w+)/i
    ];
    
    for (const pattern of vsPatterns) {
      const match = content.match(pattern);
      if (match) {
        enhancedTitle = `${match[1]} vs ${match[2]}: Comparison`;
        break;
      }
    }
    
    // Look for "Guide to X" or "X Guide" patterns
    if (enhancedTitle === originalTitle) {
      const guidePatterns = [
        /guide\s+to\s+([^.!?\n]+)/i,
        /([^.!?\n]+)\s+guide/i,
        /how\s+to\s+([^.!?\n]+)/i,
        /([^.!?\n]+)\s+tutorial/i,
        /introduction\s+to\s+([^.!?\n]+)/i
      ];
      
      for (const pattern of guidePatterns) {
        const match = content.match(pattern);
        if (match && match[1].length > 5 && match[1].length < 50) {
          enhancedTitle = match[1].trim();
          if (!enhancedTitle.toLowerCase().includes('guide')) {
            enhancedTitle += ' Guide';
          }
          break;
        }
      }
    }
    
    // Look for specific tool/technology focus
    if (enhancedTitle === originalTitle) {
      const toolPatterns = [
        /using\s+([A-Z][a-zA-Z]+)/,
        /with\s+([A-Z][a-zA-Z]+)/,
        /([A-Z][a-zA-Z]+)\s+(?:setup|configuration|deployment|implementation)/i
      ];
      
      for (const pattern of toolPatterns) {
        const match = content.match(pattern);
        if (match && match[1].length > 3) {
          const tool = match[1];
          const pathContext = pathContexts.length > 0 ? pathContexts[pathContexts.length - 1] : '';
          enhancedTitle = pathContext ? `${tool} ${pathContext}` : `${tool} Configuration`;
          break;
        }
      }
    }
  }
  
  // Strategy 3: Use path context if still generic
  if (enhancedTitle === originalTitle && pathContexts.length >= 2) {
    const context = pathContexts.slice(-2).join(' ');
    enhancedTitle = context;
  }
  
  // Strategy 4: Extract from first meaningful sentence
  if (enhancedTitle === originalTitle) {
    const meaningfulLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 20 && 
             !trimmed.startsWith('#') && 
             !trimmed.startsWith('```') &&
             !trimmed.startsWith('---') &&
             !trimmed.startsWith('*') &&
             !trimmed.startsWith('-') &&
             trimmed.includes(' '); // Must have spaces (not just a word)
    });
    
    if (meaningfulLines.length > 0) {
      let firstSentence = meaningfulLines[0].trim();
      // Clean up and limit length
      firstSentence = firstSentence
        .replace(/[#*`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (firstSentence.length > 60) {
        firstSentence = firstSentence.substring(0, 57) + '...';
      }
      
      if (firstSentence.length > 10) {
        enhancedTitle = firstSentence;
      }
    }
  }
  
  // Final cleanup
  enhancedTitle = enhancedTitle
    .replace(/[#*`]/g, '') // Remove markdown
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^[:\-\s]+/, '') // Remove leading punctuation
    .trim();
  
  // Ensure proper capitalization
  if (enhancedTitle.length > 0) {
    enhancedTitle = enhancedTitle.charAt(0).toUpperCase() + enhancedTitle.slice(1);
  }
  
  // Don't use if it's still too generic or short
  if (enhancedTitle.length < 5 || isGenericTitle(enhancedTitle)) {
    enhancedTitle = originalTitle;
  }
  
  console.log(`   Enhanced: "${enhancedTitle}"`);
  
  return enhancedTitle;
}

// Process all documents
const enhancedResults = {
  processed: [],
  statistics: {
    total: documents.length,
    enhanced: 0,
    unchanged: 0
  }
};

documents.forEach(doc => {
  const enhancedTitle = generateEnhancedTitle(doc);
  const wasEnhanced = enhancedTitle !== doc.title;
  
  enhancedResults.processed.push({
    ...doc,
    originalTitle: doc.title,
    title: enhancedTitle,
    enhanced: wasEnhanced
  });
  
  if (wasEnhanced) {
    enhancedResults.statistics.enhanced++;
  } else {
    enhancedResults.statistics.unchanged++;
  }
});

// Save results
fs.writeFileSync('enhanced-titles-results.json', JSON.stringify(enhancedResults, null, 2));

console.log('\n📊 Enhancement Results:');
console.log(`   Total documents: ${enhancedResults.statistics.total}`);
console.log(`   Enhanced titles: ${enhancedResults.statistics.enhanced}`);
console.log(`   Unchanged titles: ${enhancedResults.statistics.unchanged}`);
console.log(`   Enhancement rate: ${((enhancedResults.statistics.enhanced / enhancedResults.statistics.total) * 100).toFixed(1)}%`);

console.log('\n✅ Enhanced title generation complete!');
console.log('📁 Results saved to: enhanced-titles-results.json');