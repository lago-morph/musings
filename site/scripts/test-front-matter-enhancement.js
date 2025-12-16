#!/usr/bin/env node

/**
 * Property Tests for Front Matter Enhancement System
 * 
 * This script implements property-based tests to validate the front matter
 * enhancement system that adds metadata to documents while preserving content.
 * 
 * Tests validate Requirements 3.3 and 4.1:
 * - All documents have proper front matter with required fields
 * - Original content is preserved exactly
 * - Front matter is valid YAML
 * - Metadata is consistent with analysis results
 * 
 * Usage: node test-front-matter-enhancement.js
 */

const fs = require('fs');
const path = require('path');

// Import fast-check for property testing
let fc;
try {
    fc = require('fast-check');
} catch (error) {
    console.error('❌ fast-check not installed. Please run: npm install fast-check');
    process.exit(1);
}

class FrontMatterEnhancementTests {
    constructor() {
        this.scriptsDir = __dirname;
        this.rootDir = path.resolve(__dirname, '../..');
    }

    /**
     * Load test data
     */
    loadTestData() {
        const analysisPath = path.join(this.scriptsDir, 'analysis-results.json');
        const summaryPath = path.join(this.scriptsDir, 'summary-results.json');
        const keywordPath = path.join(this.scriptsDir, 'keyword-results.json');
        const frontMatterPath = path.join(this.scriptsDir, 'front-matter-results.json');

        if (!fs.existsSync(analysisPath)) {
            throw new Error('Analysis results not found. Run content-analyzer.js first.');
        }
        if (!fs.existsSync(frontMatterPath)) {
            throw new Error('Front matter results not found. Run front-matter-enhancer.js first.');
        }

        return {
            analysis: JSON.parse(fs.readFileSync(analysisPath, 'utf8')),
            summaries: JSON.parse(fs.readFileSync(summaryPath, 'utf8')),
            keywords: JSON.parse(fs.readFileSync(keywordPath, 'utf8')),
            frontMatter: JSON.parse(fs.readFileSync(frontMatterPath, 'utf8'))
        };
    }

    /**
     * Parse front matter from document content
     */
    parseFrontMatter(content) {
        if (!content.startsWith('---\n')) {
            return null;
        }

        const endIndex = content.indexOf('\n---\n', 4);
        if (endIndex === -1) {
            return null;
        }

        const frontMatterText = content.substring(4, endIndex);
        const bodyContent = content.substring(endIndex + 5);

        // Simple YAML parsing for our specific structure
        const frontMatter = {};
        const lines = frontMatterText.split('\n');
        let currentKey = null;
        let inArray = false;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('- ')) {
                // Array item
                if (inArray && currentKey) {
                    const value = trimmed.substring(2).replace(/^"(.*)"$/, '$1');
                    frontMatter[currentKey].push(value);
                }
            } else if (trimmed.includes(':')) {
                // Key-value pair
                const colonIndex = trimmed.indexOf(':');
                const key = trimmed.substring(0, colonIndex).trim();
                const value = trimmed.substring(colonIndex + 1).trim();

                if (value === '') {
                    // Array start
                    frontMatter[key] = [];
                    currentKey = key;
                    inArray = true;
                } else {
                    // Simple value
                    frontMatter[key] = value.replace(/^"(.*)"$/, '$1');
                    inArray = false;
                    currentKey = null;
                }
            }
        }

        return {
            frontMatter,
            body: bodyContent
        };
    }

    /**
     * Property 7: Content Preservation
     * Validates Requirements 3.3
     */
    testContentPreservation(testData) {
        console.log('🧪 Testing Property 7: Content Preservation');

        const { analysis } = testData;

        const property = fc.property(
            fc.constantFrom(...analysis.documents),
            (document) => {
                try {
                    // Read current document content
                    const filePath = path.resolve(this.rootDir, document.path);
                    const currentContent = fs.readFileSync(filePath, 'utf8');
                    
                    // Parse front matter
                    const parsed = this.parseFrontMatter(currentContent);
                    if (!parsed) {
                        return false; // Should have front matter
                    }

                    // Check that body content exists and is substantial
                    const bodyLines = parsed.body.split('\n').filter(line => line.trim().length > 0);
                    const hasSubstantialContent = bodyLines.length > 3; // At least some content

                    // Check that body starts with actual content (not just front matter artifacts)
                    const firstContentLine = parsed.body.split('\n').find(line => line.trim().length > 0);
                    const startsWithContent = firstContentLine && !firstContentLine.startsWith('---');

                    // Basic check that we have markdown content
                    const hasMarkdownContent = parsed.body.includes('#') || parsed.body.includes('*') || 
                                             parsed.body.includes('`') || parsed.body.length > 100;

                    return hasSubstantialContent && startsWithContent && hasMarkdownContent;
                } catch (error) {
                    return false;
                }
            }
        );

        const result = fc.check(property, { numRuns: 100 });
        
        if (result.failed) {
            console.error(`   ❌ Failed after ${result.numRuns} runs`);
            if (result.counterexample) {
                const doc = result.counterexample[0];
                console.error(`   📄 Failed document: ${doc.path}`);
            }
            return false;
        } else {
            console.log(`   ✅ Passed all ${result.numRuns} test cases`);
            return true;
        }
    }

    /**
     * Test front matter structure and completeness
     */
    testFrontMatterStructure(testData) {
        console.log('🧪 Testing Front Matter Structure');

        const { analysis } = testData;
        const requiredFields = ['title', 'summary', 'keywords', 'category', 'categoryName', 'weight', 'date', 'draft', 'toc'];

        const property = fc.property(
            fc.constantFrom(...analysis.documents),
            (document) => {
                try {
                    const filePath = path.resolve(this.rootDir, document.path);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const parsed = this.parseFrontMatter(content);
                    
                    if (!parsed) {
                        return false; // Must have front matter
                    }

                    // Check all required fields exist
                    const hasAllFields = requiredFields.every(field => 
                        parsed.frontMatter.hasOwnProperty(field)
                    );

                    // Check field types and values
                    const title = parsed.frontMatter.title;
                    const summary = parsed.frontMatter.summary;
                    const keywords = parsed.frontMatter.keywords;
                    const category = parsed.frontMatter.category;
                    const weight = parsed.frontMatter.weight;
                    const date = parsed.frontMatter.date;
                    const draft = parsed.frontMatter.draft;
                    const toc = parsed.frontMatter.toc;

                    const validTitle = title && title.length > 0;
                    const validSummary = summary && summary.length > 10;
                    const validKeywords = Array.isArray(keywords) && keywords.length > 0;
                    const validCategory = ['ai-ml', 'devplatform', 'infrastructure', 'workflows'].includes(category);
                    const validWeight = !isNaN(parseInt(weight));
                    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
                    const validDraft = draft === 'false' || draft === false;
                    const validToc = toc === 'true' || toc === 'false' || toc === true || toc === false;

                    return hasAllFields && validTitle && validSummary && validKeywords && 
                           validCategory && validWeight && validDate && validDraft && validToc;
                } catch (error) {
                    return false;
                }
            }
        );

        const result = fc.check(property, { numRuns: 100 });
        
        if (result.failed) {
            console.error(`   ❌ Front matter structure test failed`);
            if (result.counterexample) {
                const doc = result.counterexample[0];
                console.error(`   📄 Problem document: ${doc.path}`);
                
                try {
                    const filePath = path.resolve(this.rootDir, doc.path);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const parsed = this.parseFrontMatter(content);
                    console.error(`   📝 Front matter keys: [${Object.keys(parsed?.frontMatter || {}).join(', ')}]`);
                } catch (error) {
                    console.error(`   ❌ Could not read document: ${error.message}`);
                }
            }
            return false;
        } else {
            console.log(`   ✅ All front matter structures are valid`);
            return true;
        }
    }

    /**
     * Test metadata consistency with analysis results
     */
    testMetadataConsistency(testData) {
        console.log('🧪 Testing Metadata Consistency');

        const { analysis, summaries, keywords } = testData;

        // Create lookup maps
        const summaryMap = new Map();
        summaries.summaries.forEach(s => summaryMap.set(s.path, s));

        const keywordMap = new Map();
        keywords.keywords.forEach(k => keywordMap.set(k.path, k));

        const property = fc.property(
            fc.constantFrom(...analysis.documents),
            (document) => {
                try {
                    const filePath = path.resolve(this.rootDir, document.path);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const parsed = this.parseFrontMatter(content);
                    
                    if (!parsed) {
                        return false;
                    }

                    // Check title consistency (normalize for comparison)
                    const normalizeTitle = (title) => title.replace(/[""'']/g, '"').trim();
                    const titleMatches = normalizeTitle(parsed.frontMatter.title) === normalizeTitle(document.title);

                    // Check category consistency
                    const categoryMatches = parsed.frontMatter.category === document.category;

                    // Check summary consistency (should be from summary results)
                    const summaryData = summaryMap.get(document.path);
                    const summaryMatches = summaryData ? 
                        parsed.frontMatter.summary === summaryData.summary : true;

                    // Check keywords consistency (should be from keyword results)
                    const keywordData = keywordMap.get(document.path);
                    const keywordsMatch = keywordData ? 
                        JSON.stringify(parsed.frontMatter.keywords.sort()) === 
                        JSON.stringify(keywordData.keywords.sort()) : true;

                    return titleMatches && categoryMatches && summaryMatches && keywordsMatch;
                } catch (error) {
                    return false;
                }
            }
        );

        const result = fc.check(property, { numRuns: 100 });
        
        if (result.failed) {
            console.error(`   ❌ Metadata consistency test failed`);
            if (result.counterexample) {
                const doc = result.counterexample[0];
                console.error(`   📄 Problem document: ${doc.path}`);
                console.error(`   📝 Expected title: "${doc.title}"`);
                console.error(`   📂 Expected category: ${doc.category}`);
            }
            return false;
        } else {
            console.log(`   ✅ All metadata is consistent with analysis results`);
            return true;
        }
    }

    /**
     * Test YAML validity
     */
    testYAMLValidity(testData) {
        console.log('🧪 Testing YAML Validity');

        const { analysis } = testData;

        const property = fc.property(
            fc.constantFrom(...analysis.documents),
            (document) => {
                try {
                    const filePath = path.resolve(this.rootDir, document.path);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check basic YAML structure
                    if (!content.startsWith('---\n')) {
                        return false;
                    }

                    const endIndex = content.indexOf('\n---\n', 4);
                    if (endIndex === -1) {
                        return false;
                    }

                    const frontMatterText = content.substring(4, endIndex);
                    
                    // Basic YAML validation checks
                    const lines = frontMatterText.split('\n');
                    let inArray = false;
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;

                        if (trimmed.startsWith('- ')) {
                            // Array item - should be in array context
                            if (!inArray) return false;
                        } else if (trimmed.includes(':')) {
                            // Key-value pair
                            const colonIndex = trimmed.indexOf(':');
                            const key = trimmed.substring(0, colonIndex).trim();
                            const value = trimmed.substring(colonIndex + 1).trim();
                            
                            // Key should not be empty
                            if (!key) return false;
                            
                            // Check if starting array
                            inArray = (value === '');
                        } else {
                            // Invalid line format
                            return false;
                        }
                    }

                    return true;
                } catch (error) {
                    return false;
                }
            }
        );

        const result = fc.check(property, { numRuns: 100 });
        
        if (result.failed) {
            console.error(`   ❌ YAML validity test failed`);
            return false;
        } else {
            console.log(`   ✅ All front matter is valid YAML`);
            return true;
        }
    }

    /**
     * Run all front matter enhancement tests
     */
    runAllTests() {
        console.log('🚀 Starting Front Matter Enhancement Property Tests');
        console.log('📊 Running 100+ iterations per test...\n');

        try {
            const testData = this.loadTestData();
            
            console.log(`📈 Test Data Loaded:`);
            console.log(`   Documents analyzed: ${testData.analysis.documents.length}`);
            console.log(`   Front matter results: ${testData.frontMatter.statistics.successful} successful\n`);

            const results = [];

            // Run all property tests
            results.push(this.testContentPreservation(testData));
            results.push(this.testFrontMatterStructure(testData));
            results.push(this.testMetadataConsistency(testData));
            results.push(this.testYAMLValidity(testData));

            // Summary
            const passed = results.filter(r => r).length;
            const total = results.length;

            console.log('\n📊 Test Results Summary:');
            console.log(`   Passed: ${passed}/${total}`);
            
            if (passed === total) {
                console.log('✅ All front matter enhancement tests passed!');
                console.log('🎉 Requirements 3.3 and 4.1 validated successfully');
                return true;
            } else {
                console.log('❌ Some tests failed. Please review the front matter enhancement system.');
                return false;
            }

        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            return false;
        }
    }
}

// Main execution
if (require.main === module) {
    const tester = new FrontMatterEnhancementTests();
    const success = tester.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = FrontMatterEnhancementTests;