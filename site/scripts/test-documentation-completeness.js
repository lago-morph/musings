const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Property-Based Test for Documentation Completeness
 * 
 * **Feature: hugo-docs-site, Property 12: Documentation Completeness**
 * **Validates: Requirements 5.1, 5.2, 5.3, 6.1, 6.2, 6.3**
 * 
 * Tests that generated project documentation includes historical prompt, agent guidelines, 
 * and quick reference with sufficient detail for project continuation.
 */

console.log('🧪 Property Test: Documentation Completeness');
console.log('============================================');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Define required documentation files
const REQUIRED_DOCS = [
  {
    path: 'AGENTS.md',
    name: 'Agent Guidelines',
    requirements: ['5.2', '5.4'],
    minSize: 1000, // Minimum file size in bytes
    requiredContent: [
      'Agent Guidelines',
      'Hugo',
      'Books theme',
      'requirements.md',
      'design.md',
      'tasks.md'
    ]
  },
  {
    path: 'QUICK_REFERENCE.md',
    name: 'Quick Reference',
    requirements: ['6.1', '6.2', '6.3'],
    minSize: 2000,
    requiredContent: [
      'Quick Reference',
      'regenerate-site.js',
      'hugo server',
      'deployment',
      'commands'
    ]
  },
  {
    path: 'PROJECT_STATUS.md',
    name: 'Project Status',
    requirements: ['5.1', '6.4'],
    minSize: 1500,
    requiredContent: [
      'Project Status',
      'Hugo',
      'completed',
      'progress',
      'tasks'
    ]
  },
  {
    path: 'HISTORICAL_PROMPT.md',
    name: 'Historical Prompt',
    requirements: ['5.1', '5.3'],
    minSize: 500,
    requiredContent: [
      'historical reference',
      'prompt'
    ]
  }
];

// Property 12: Documentation Completeness
// For any generated project documentation, it should include historical prompt, 
// agent guidelines, and quick reference with sufficient detail for project continuation
const documentExistenceProperty = fc.property(
  fc.constantFrom(...REQUIRED_DOCS),
  (docSpec) => {
    const filePath = path.join(REPO_ROOT, docSpec.path);
    
    // File must exist
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    // File must be readable
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      return false;
    }
    
    // File must be a markdown file
    if (!docSpec.path.endsWith('.md')) {
      return false;
    }
    
    return true;
  }
);

// Property: Documentation files should have sufficient content
const documentContentProperty = fc.property(
  fc.constantFrom(...REQUIRED_DOCS),
  (docSpec) => {
    const filePath = path.join(REPO_ROOT, docSpec.path);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // File should meet minimum size requirement
    if (content.length < docSpec.minSize) {
      return false;
    }
    
    // File should contain required content elements
    for (const requiredText of docSpec.requiredContent) {
      if (!content.toLowerCase().includes(requiredText.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  }
);

// Property: Agent guidelines should contain comprehensive information
const agentGuidelinesProperty = fc.property(
  fc.constant(path.join(REPO_ROOT, 'AGENTS.md')),
  (agentsPath) => {
    if (!fs.existsSync(agentsPath)) {
      return false;
    }
    
    const content = fs.readFileSync(agentsPath, 'utf8');
    
    // Should contain essential project information
    const essentialElements = [
      'Hugo',
      'Books theme',
      'requirements',
      'design',
      'tasks',
      'content processing',
      'navigation',
      'mermaid',
      'property-based',
      'fast-check'
    ];
    
    for (const element of essentialElements) {
      if (!content.toLowerCase().includes(element.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  }
);

// Property: Quick reference should enable rapid re-engagement
const quickReferenceProperty = fc.property(
  fc.constant(path.join(REPO_ROOT, 'QUICK_REFERENCE.md')),
  (quickRefPath) => {
    if (!fs.existsSync(quickRefPath)) {
      return false;
    }
    
    const content = fs.readFileSync(quickRefPath, 'utf8');
    
    // Should contain practical commands and instructions
    const practicalElements = [
      'regenerate-site.js',
      'hugo server',
      'powershell',
      'cd site',
      'deployment',
      'github pages',
      'commands',
      'troubleshooting'
    ];
    
    for (const element of practicalElements) {
      if (!content.toLowerCase().includes(element.toLowerCase())) {
        return false;
      }
    }
    
    // Should have code blocks for commands
    if (!content.includes('```')) {
      return false;
    }
    
    return true;
  }
);

// Property: Project status should reflect current state
const projectStatusProperty = fc.property(
  fc.constant(path.join(REPO_ROOT, 'PROJECT_STATUS.md')),
  (statusPath) => {
    if (!fs.existsSync(statusPath)) {
      return false;
    }
    
    const content = fs.readFileSync(statusPath, 'utf8');
    
    // Should contain status indicators
    const statusElements = [
      '✅', // Completed tasks marker
      'complete',
      'progress',
      'hugo',
      'documents',
      'categories'
    ];
    
    for (const element of statusElements) {
      if (!content.toLowerCase().includes(element.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  }
);

// Property: Spec files should exist and be complete
const specFilesProperty = fc.property(
  fc.constantFrom([
    '.kiro/specs/hugo-docs-site/requirements.md',
    '.kiro/specs/hugo-docs-site/design.md',
    '.kiro/specs/hugo-docs-site/tasks.md'
  ]),
  (specPath) => {
    const filePath = path.join(REPO_ROOT, specPath);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Spec files should be substantial
    if (content.length < 1000) {
      return false;
    }
    
    // All spec files should be markdown and have some structure
    return content.includes('#') && content.length > 1000;
  }
);

// Run the property tests
console.log('\n🔍 Running Property Tests...');

let allTestsPassed = true;

try {
  console.log('\n📋 Test 1: Documentation File Existence');
  console.log('   Testing that all required documentation files exist...');
  
  fc.assert(documentExistenceProperty, { 
    numRuns: REQUIRED_DOCS.length,
    verbose: false 
  });
  
  console.log('   ✓ All required documentation files exist');
  
} catch (error) {
  console.error('   ✗ Documentation existence test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📝 Test 2: Documentation Content Completeness');
  console.log('   Testing that documentation files have sufficient content...');
  
  fc.assert(documentContentProperty, { 
    numRuns: REQUIRED_DOCS.length,
    verbose: false 
  });
  
  console.log('   ✓ Documentation files have sufficient content');
  
} catch (error) {
  console.error('   ✗ Documentation content test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n🤖 Test 3: Agent Guidelines Completeness');
  console.log('   Testing that agent guidelines contain comprehensive information...');
  
  fc.assert(agentGuidelinesProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Agent guidelines are comprehensive');
  
} catch (error) {
  console.error('   ✗ Agent guidelines test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n⚡ Test 4: Quick Reference Practicality');
  console.log('   Testing that quick reference enables rapid re-engagement...');
  
  fc.assert(quickReferenceProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Quick reference enables rapid re-engagement');
  
} catch (error) {
  console.error('   ✗ Quick reference test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📊 Test 5: Project Status Accuracy');
  console.log('   Testing that project status reflects current state...');
  
  fc.assert(projectStatusProperty, { 
    numRuns: 5,
    verbose: false 
  });
  
  console.log('   ✓ Project status reflects current state');
  
} catch (error) {
  console.error('   ✗ Project status test failed:', error.message);
  allTestsPassed = false;
}

try {
  console.log('\n📋 Test 6: Specification Files Completeness');
  console.log('   Testing that specification files are complete...');
  
  // Simple existence and size check for spec files
  const specFiles = [
    '.kiro/specs/hugo-docs-site/requirements.md',
    '.kiro/specs/hugo-docs-site/design.md',
    '.kiro/specs/hugo-docs-site/tasks.md'
  ];
  
  let specFilesValid = true;
  for (const specPath of specFiles) {
    const filePath = path.join(REPO_ROOT, specPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1000) {
      specFilesValid = false;
      break;
    }
  }
  
  if (specFilesValid) {
    console.log('   ✓ Specification files are complete');
  } else {
    console.error('   ✗ Some specification files are missing or too small');
    allTestsPassed = false;
  }
  
} catch (error) {
  console.error('   ✗ Specification files test failed:', error.message);
  allTestsPassed = false;
}

// Display documentation statistics
console.log('\n📊 Documentation Statistics:');

const docStats = {};
REQUIRED_DOCS.forEach(docSpec => {
  const filePath = path.join(REPO_ROOT, docSpec.path);
  docStats[docSpec.name] = {
    exists: fs.existsSync(filePath),
    size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
    requirements: docSpec.requirements
  };
});

Object.entries(docStats).forEach(([name, stats]) => {
  const status = stats.exists ? '✓' : '✗';
  const size = stats.exists ? `${Math.round(stats.size / 1024)}KB` : 'N/A';
  const reqs = stats.requirements.join(', ');
  console.log(`   ${status} ${name}: ${size} (validates: ${reqs})`);
});

// Check spec files
console.log('\n📋 Specification Files:');
const specFiles = [
  '.kiro/specs/hugo-docs-site/requirements.md',
  '.kiro/specs/hugo-docs-site/design.md',
  '.kiro/specs/hugo-docs-site/tasks.md'
];

specFiles.forEach(specPath => {
  const filePath = path.join(REPO_ROOT, specPath);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : '✗';
  const size = exists ? `${Math.round(fs.statSync(filePath).size / 1024)}KB` : 'N/A';
  const fileName = path.basename(specPath);
  console.log(`   ${status} ${fileName}: ${size}`);
});

// Final result
if (allTestsPassed) {
  console.log('\n✅ All documentation completeness property tests passed!');
  console.log('   Project documentation is complete and comprehensive.');
  process.exit(0);
} else {
  console.log('\n❌ Some documentation completeness tests failed!');
  console.log('   Review the documentation files and ensure they meet requirements.');
  process.exit(1);
}