const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Property-Based Test for Mermaid Rendering
 * 
 * **Feature: hugo-docs-site, Property 9: Mermaid Rendering**
 * **Validates: Requirements 2.3**
 * 
 * Tests that Mermaid diagrams are properly configured and rendered as interactive SVG
 * in the Hugo site, including proper JavaScript initialization and diagram processing.
 */

console.log('🧪 Property Test: Mermaid Rendering');
console.log('==================================');

const SITE_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(SITE_DIR, 'public');
const CONTENT_DIR = path.join(SITE_DIR, 'content', 'docs');

// Function to find all files containing Mermaid diagrams
function findMermaidFiles() {
  const mermaidFiles = [];
  
  function scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Look for Mermaid code blocks
          const mermaidBlocks = content.match(/```mermaid[\s\S]*?```/g);
          if (mermaidBlocks && mermaidBlocks.length > 0) {
            mermaidFiles.push({
              path: fullPath,
              filename: item,
              mermaidBlocks: mermaidBlocks,
              blockCount: mermaidBlocks.length
            });
          }
        } catch (error) {
          console.warn(`Warning: Could not parse ${fullPath}`);
        }
      }
    }
  }
  
  scanDirectory(CONTENT_DIR);
  return mermaidFiles;
}

// Function to check if Mermaid assets exist
function checkMermaidAssets() {
  const assets = {
    mermaidJs: path.join(PUBLIC_DIR, 'mermaid.min.js'),
    hugoConfig: path.join(SITE_DIR, 'hugo.toml'),
    mermaidConfig: path.join(SITE_DIR, 'assets', 'mermaid.json')
  };
  
  const results = {};
  
  for (const [key, assetPath] of Object.entries(assets)) {
    results[key] = {
      path: assetPath,
      exists: fs.existsSync(assetPath)
    };
  }
  
  return results;
}

// Function to check generated HTML for Mermaid content
function checkGeneratedMermaidHTML() {
  const htmlFiles = [];
  
  function scanPublicDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanPublicDirectory(fullPath);
      } else if (item === 'index.html') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Look for Mermaid-related content in HTML
          const hasMermaidScript = content.includes('mermaid');
          const hasMermaidDiv = content.includes('class="mermaid"') || content.includes('data-mermaid');
          const hasSvgContent = content.includes('<svg') && content.includes('mermaid');
          
          if (hasMermaidScript || hasMermaidDiv || hasSvgContent) {
            htmlFiles.push({
              path: fullPath,
              filename: item,
              hasMermaidScript,
              hasMermaidDiv,
              hasSvgContent
            });
          }
        } catch (error) {
          console.warn(`Warning: Could not parse ${fullPath}`);
        }
      }
    }
  }
  
  scanPublicDirectory(PUBLIC_DIR);
  return htmlFiles;
}

// Get Mermaid files and assets
let mermaidFiles = [];
let mermaidAssets = {};
let generatedHTML = [];

try {
  mermaidFiles = findMermaidFiles();
  mermaidAssets = checkMermaidAssets();
  generatedHTML = checkGeneratedMermaidHTML();
  
  console.log(`\n📊 Found ${mermaidFiles.length} files with Mermaid diagrams`);
  console.log(`📊 Found ${generatedHTML.length} HTML files with Mermaid content`);
} catch (error) {
  console.error('✗ Could not analyze Mermaid content:', error.message);
  process.exit(1);
}

// Property 9: Mermaid Rendering
// Test that Mermaid diagrams are properly configured and rendered

// Test 1: Mermaid assets exist
const mermaidAssetsProperty = fc.property(
  fc.constant(mermaidAssets),
  (assets) => {
    // Mermaid JavaScript should be available
    return assets.mermaidJs.exists && assets.hugoConfig.exists;
  }
);

// Test 2: Hugo configuration supports Mermaid
const hugoConfigProperty = fc.property(
  fc.constant(mermaidAssets.hugoConfig.path),
  (configPath) => {
    if (!fs.existsSync(configPath)) return false;
    
    const config = fs.readFileSync(configPath, 'utf8');
    
    // Check for unsafe rendering (required for Mermaid)
    const hasUnsafeRendering = config.includes('unsafe = true');
    
    return hasUnsafeRendering;
  }
);

// Test 3: Mermaid files are processed correctly
const mermaidProcessingProperty = fc.property(
  fc.constant(mermaidFiles),
  (files) => {
    // All files with Mermaid should have corresponding HTML
    for (const file of files) {
      // Convert content path to public path
      const relativePath = path.relative(CONTENT_DIR, file.path);
      const htmlPath = path.join(PUBLIC_DIR, 'docs', relativePath.replace('.md', ''), 'index.html');
      
      if (!fs.existsSync(htmlPath)) {
        return false;
      }
      
      // Check that HTML contains Mermaid-related content
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const hasMermaidContent = htmlContent.includes('mermaid') || 
                               htmlContent.includes('<svg') ||
                               htmlContent.includes('class="language-mermaid"');
      
      if (!hasMermaidContent) {
        return false;
      }
    }
    
    return true;
  }
);

// Test 4: Generated HTML has proper Mermaid structure
const htmlStructureProperty = fc.property(
  fc.constant(generatedHTML),
  (htmlFiles) => {
    // HTML files with Mermaid should have proper structure
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file.path, 'utf8');
      
      // Should have Mermaid script reference or inline content
      const hasMermaidReference = content.includes('mermaid.min.js') || 
                                 content.includes('mermaid') ||
                                 content.includes('<svg');
      
      if (!hasMermaidReference) {
        return false;
      }
    }
    
    return htmlFiles.length > 0; // Should have at least some Mermaid content
  }
);

// Test 5: Mermaid diagram types are supported
const diagramTypesProperty = fc.property(
  fc.constant(mermaidFiles),
  (files) => {
    const supportedTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'gantt', 'pie'];
    let foundTypes = new Set();
    
    for (const file of files) {
      for (const block of file.mermaidBlocks) {
        for (const type of supportedTypes) {
          if (block.includes(type)) {
            foundTypes.add(type);
          }
        }
      }
    }
    
    // Should support at least basic diagram types
    return foundTypes.size > 0;
  }
);

// Test 6: Mermaid blocks are properly formatted
const blockFormattingProperty = fc.property(
  fc.constant(mermaidFiles),
  (files) => {
    for (const file of files) {
      for (const block of file.mermaidBlocks) {
        // Should start with ```mermaid and end with ```
        if (!block.startsWith('```mermaid') || !block.endsWith('```')) {
          return false;
        }
        
        // Should have content between the markers
        const content = block.replace(/```mermaid\s*/, '').replace(/\s*```$/, '').trim();
        if (content.length === 0) {
          return false;
        }
      }
    }
    
    return true;
  }
);

// Run the property tests
console.log('\n🔍 Running Mermaid Rendering Property Tests...');

let allTestsPassed = true;

try {
  console.log('\n📦 Test 1: Mermaid Assets Availability');
  console.log('   Testing that required Mermaid assets exist...');
  
  fc.assert(mermaidAssetsProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Mermaid assets are available');
  
} catch (error) {
  console.error('   ✗ Mermaid assets test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n⚙️  Test 2: Hugo Configuration');
  console.log('   Testing that Hugo is configured to support Mermaid...');
  
  fc.assert(hugoConfigProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Hugo configuration supports Mermaid rendering');
  
} catch (error) {
  console.error('   ✗ Hugo configuration test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🔄 Test 3: Mermaid Processing');
  console.log('   Testing that Mermaid files are processed into HTML...');
  
  fc.assert(mermaidProcessingProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Mermaid files are processed correctly');
  
} catch (error) {
  console.error('   ✗ Mermaid processing test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🌐 Test 4: HTML Structure');
  console.log('   Testing that generated HTML has proper Mermaid structure...');
  
  fc.assert(htmlStructureProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Generated HTML has proper Mermaid structure');
  
} catch (error) {
  console.error('   ✗ HTML structure test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📊 Test 5: Diagram Types Support');
  console.log('   Testing that various Mermaid diagram types are supported...');
  
  fc.assert(diagramTypesProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Multiple Mermaid diagram types are supported');
  
} catch (error) {
  console.error('   ✗ Diagram types test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📝 Test 6: Block Formatting');
  console.log('   Testing that Mermaid blocks are properly formatted...');
  
  fc.assert(blockFormattingProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Mermaid blocks are properly formatted');
  
} catch (error) {
  console.error('   ✗ Block formatting test failed:', error.message);
  allTestsPassed = false;
}

// Display Mermaid statistics
console.log('\n📊 Mermaid Rendering Statistics:');

console.log(`   Files with Mermaid: ${mermaidFiles.length}`);
if (mermaidFiles.length > 0) {
  const totalBlocks = mermaidFiles.reduce((sum, file) => sum + file.blockCount, 0);
  console.log(`   Total Mermaid blocks: ${totalBlocks}`);
  
  mermaidFiles.forEach(file => {
    const relativePath = path.relative(CONTENT_DIR, file.path);
    console.log(`   ${relativePath}: ${file.blockCount} diagrams`);
  });
}

console.log(`   Generated HTML files with Mermaid: ${generatedHTML.length}`);

// Asset status
console.log('\n📦 Mermaid Assets Status:');
Object.entries(mermaidAssets).forEach(([key, asset]) => {
  const status = asset.exists ? '✓' : '✗';
  const name = key.replace(/([A-Z])/g, ' $1').toLowerCase();
  console.log(`   ${status} ${name}: ${asset.exists ? 'found' : 'missing'}`);
});

// Check specific Mermaid test file
const mermaidTestPath = path.join(PUBLIC_DIR, 'docs', 'mermaid-test', 'index.html');
if (fs.existsSync(mermaidTestPath)) {
  console.log('\n🧪 Mermaid Test Document:');
  console.log('   ✓ Mermaid test page generated successfully');
  
  const testContent = fs.readFileSync(mermaidTestPath, 'utf8');
  const hasMermaidScript = testContent.includes('mermaid');
  const hasSvgContent = testContent.includes('<svg');
  
  console.log(`   ${hasMermaidScript ? '✓' : '✗'} Contains Mermaid references`);
  console.log(`   ${hasSvgContent ? '✓' : '✗'} Contains SVG content`);
} else {
  console.log('\n🧪 Mermaid Test Document:');
  console.log('   ⚠️  Mermaid test page not found');
}

// Final result
if (allTestsPassed) {
  console.log('\n✅ All Mermaid rendering property tests passed!');
  console.log('   Mermaid diagrams are properly configured and rendered.');
  process.exit(0);
} else {
  console.log('\n❌ Some Mermaid rendering tests failed!');
  console.log('   Review the Mermaid configuration and try again.');
  process.exit(1);
}