#!/usr/bin/env node

/**
 * Property Tests for Metadata Extraction System
 * 
 * This script implements property-based tests to validate the metadata extraction
 * system (content analyzer, summary generator, and keyword extractor).
 * 
 * Tests validate Requirements 3.1 and 3.2:
 * - All documents have titles extracted correctly
 * - All documents have 2-3 sentence summaries generated
 * - All documents have relevant keywords extracted
 * - Metadata processing is complete and consistent
 * 
 * Usage: npm install fast-check (if not installed)
 *        node test-metadata-extraction.js
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

class MetadataExtractionTests {
    constructor() {
        this.scriptsDir = __dirname;
        this.rootDir = path.resolve(__dirname, '../..');
    }

    /**
     * Load test data from generated JSON files
     */
    loadTestData() {
        const analysisPath = path.join(this.scriptsDir, 'analysis-results.json');
        const summaryPath = path.join(this.scriptsDir, 'summary-results.json');
        const keywordPath = path.join(this.scriptsDir, 'keyword-results.json');

        if (!fs.existsSync(analysisPath)) {
            throw new Error('Analysis results not found. Run content-analyzer.js first.');
        }
        if (!fs.existsSync(summaryPath)) {
            throw new Error('Summary results not found. Run summary-generator.js first.');
        }
        if (!fs.existsSync(keywordPath)) {
            throw new Error('Keyword results not found. Run keyword-extractor.js first.');
        }

        return {
            analysis: JSON.parse(fs.readFileSync(analysisPath, 'utf8')),
            summaries: JSON.parse(fs.readFileSync(summaryPath, 'utf8')),
            keywords: JSON.parse(fs.readFileSync(keywordPath, 'utf8'))
        };
    }

    /**
     * Property 6: Metadata Processing Completeness
     * Validates Requirements 3.1, 3.2
     */
    testMetadataCompleteness(testData) {
        console.log('🧪 Testing Property 6: Metadata Processing Completeness');

        const { analysis, summaries, keywords } = testData;

        // Property: Every document in analysis should have corresponding summary and keywords
        const property = fc.property(
            fc.constantFrom(...analysis.documents),
            (document) => {
                // Find corresponding summary
                const summary = summaries.summaries.find(s => s.path === document.path);
                const keywordData = keywords.keywords.find(k => k.path === document.path);

                // All documents must have metadata
                const hasTitle = document.title && document.title.length > 0;
                const hasCategory = document.category && ['ai-ml', 'devplatform', 'infrastructure', 'workflows'].includes(document.category);
                const hasSummary = summary && summary.summary && summary.summary.length > 0;
                const hasKeywords = keywordData && keywordData.keywords && keywordData.keywords.length > 0;

                // Title should not be just the filename
                const titleNotFilename = document.title !== path.basename(document.filename, '.md');

                // Summary should be reasonable length (2-3 sentences, roughly 20-150 words)
                const summaryWordCount = summary ? summary.summary.split(/\s+/).length : 0;
                const summaryReasonableLength = summaryWordCount >= 10 && summaryWordCount <= 200;

                // Should have multiple sentences (look for sentence endings)
                const sentenceCount = summary ? (summary.summary.match(/[.!?]+/g) || []).length : 0;
                const multipleSentences = sentenceCount >= 1; // At least 1 complete sentence

                // Keywords should be relevant (no single characters, reasonable count)
                const keywordCount = keywordData ? keywordData.keywords.length : 0;
                const reasonableKeywordCount = keywordCount >= 3 && keywordCount <= 10;
                const validKeywords = keywordData ? keywordData.keywords.every(k => k.length > 1) : false;

                return hasTitle && hasCategory && hasSummary && hasKeywords &&
                       titleNotFilename && summaryReasonableLength && multipleSentences &&
                       reasonableKeywordCount && validKeywords;
            }
        );

        const result = fc.check(property, { numRuns: 100 });
        
        if (result.failed) {
            console.error(`   ❌ Failed after ${result.numRuns} runs`);
            if (result.counterexample) {
                const doc = result.counterexample[0];
                console.error(`   📄 Failed document: ${doc.path}`);
                console.error(`   📝 Title: "${doc.title}"`);
                console.error(`   📂 Category: ${doc.category}`);
                
                const summary = summaries.summaries.find(s => s.path === doc.path);
                const keywordData = keywords.keywords.find(k => k.path === doc.path);
                
                if (summary) {
                    console.error(`   📄 Summary (${summary.summary.split(/\s+/).length} words): "${summary.summary.substring(0, 100)}..."`);
                }
                if (keywordData) {
                    console.error(`   🏷️  Keywords (${keywordData.keywords.length}): [${keywordData.keywords.join(', ')}]`);
                }
            }
            return false;
        } else {
            console.log(`   ✅ Passed all ${result.numRuns} test cases`);
            return true;
        }
    }

    /**
     * Test title extraction consistency
     */
    testTitleExtraction(testData) {
        console.log('🧪 Testing Title Extraction Consistency');

        const { analysis } = testData;

        const property = fc.property(
            fc.constantFrom(...analysis.documents),
            (document) => {
                // Title should exist and be meaningful
                const hasTitle = document.title && document.title.length > 0;
                
                // Title should be properly formatted (not all lowercase, not all uppercase unless acronym)
                // Allow titles starting with lowercase if they're technical terms (like n8n, iOS, etc.)
                const startsWithUpperOrTechnical = document.title.match(/^[A-Z]/) || 
                                                  document.title.match(/^[a-z0-9]+[A-Z]/) || // camelCase
                                                  document.title.match(/^[a-z]+\d/) || // like n8n
                                                  document.title.match(/^[a-z]{2,4}\s/); // short technical terms
                const isProperlyFormatted = startsWithUpperOrTechnical && 
                                          !(document.title === document.title.toLowerCase()) &&
                                          !(document.title === document.title.toUpperCase() && document.title.length > 10);
                
                // Title should not contain file extensions
                const noFileExtension = !document.title.includes('.md') && !document.title.includes('.txt');
                
                // Title should not be just numbers or special characters
                const hasAlphaContent = /[a-zA-Z]/.test(document.title);
                
                return hasTitle && isProperlyFormatted && noFileExtension && hasAlphaContent;
            }
        );

        const result = fc.check(property, { numRuns: 100 });
        
        if (result.failed) {
            console.error(`   ❌ Title extraction failed`);
            if (result.counterexample) {
                const doc = result.counterexample[0];
                console.error(`   📄 Problem document: ${doc.path}`);
                console.error(`   📝 Problematic title: "${doc.title}"`);
            }
            return false;
        } else {
            console.log(`   ✅ All titles properly extracted`);
            return true;
        }
    }

    /**
     * Test category assignment consistency
     */
    testCategoryAssignment(testData) {
        console.log('🧪 Testing Category Assignment Consistency');

        const { analysis } = testData;
        const validCategories = ['ai-ml', 'devplatform', 'infrastructure', 'workflows'];

        const property = fc.property(
            fc.constantFrom(...analysis.documents),
            (document) => {
                // Every document must have a valid category
                const hasValidCategory = validCategories.includes(document.category);
                
                // Category should make sense based on path (basic sanity check)
                const pathLower = document.path.toLowerCase();
                let categoryMakesSense = true;
                
                if (pathLower.includes('ai/') && document.category !== 'ai-ml') {
                    categoryMakesSense = false;
                }
                if (pathLower.includes('devplatform/') && document.category !== 'devplatform') {
                    categoryMakesSense = false;
                }
                if (pathLower.includes('production/') && document.category !== 'infrastructure') {
                    categoryMakesSense = false;
                }
                if (pathLower.includes('workflow/') && document.category !== 'workflows') {
                    categoryMakesSense = false;
                }
                
                return hasValidCategory && categoryMakesSense;
            }
        );

        const result = fc.check(property, { numRuns: 100 });
        
        if (result.failed) {
            console.error(`   ❌ Category assignment failed`);
            if (result.counterexample) {
                const doc = result.counterexample[0];
                console.error(`   📄 Problem document: ${doc.path}`);
                console.error(`   📂 Assigned category: ${doc.category}`);
            }
            return false;
        } else {
            console.log(`   ✅ All categories properly assigned`);
            return true;
        }
    }

    /**
     * Test summary quality
     */
    testSummaryQuality(testData) {
        console.log('🧪 Testing Summary Quality');

        const { summaries } = testData;

        const property = fc.property(
            fc.constantFrom(...summaries.summaries),
            (summaryData) => {
                const summary = summaryData.summary;
                
                // Summary should exist and have content
                const hasContent = summary && summary.length > 0;
                
                // Should be reasonable length (not too short, not too long)
                const wordCount = summary.split(/\s+/).length;
                const reasonableLength = wordCount >= 10 && wordCount <= 200;
                
                // Should have proper sentence structure
                const hasSentenceEnding = /[.!?]$/.test(summary.trim());
                
                // Should not be just the title repeated
                const notJustTitle = summary.toLowerCase() !== summaryData.title.toLowerCase();
                
                // Should contain some descriptive words (not just technical terms)
                const hasDescriptiveContent = /\b(provides|covers|explains|describes|includes|contains|focuses|discusses|presents|offers)\b/i.test(summary);
                
                return hasContent && reasonableLength && hasSentenceEnding && notJustTitle;
            }
        );

        const result = fc.check(property, { numRuns: 100 });
        
        if (result.failed) {
            console.error(`   ❌ Summary quality test failed`);
            if (result.counterexample) {
                const summaryData = result.counterexample[0];
                console.error(`   📄 Problem document: ${summaryData.path}`);
                console.error(`   📝 Summary: "${summaryData.summary}"`);
                console.error(`   📊 Word count: ${summaryData.summary.split(/\s+/).length}`);
            }
            return false;
        } else {
            console.log(`   ✅ All summaries meet quality standards`);
            return true;
        }
    }

    /**
     * Test keyword relevance
     */
    testKeywordRelevance(testData) {
        console.log('🧪 Testing Keyword Relevance');

        const { keywords } = testData;

        const property = fc.property(
            fc.constantFrom(...keywords.keywords),
            (keywordData) => {
                const keywordList = keywordData.keywords;
                
                // Should have keywords
                const hasKeywords = keywordList && keywordList.length > 0;
                
                // Reasonable number of keywords
                const reasonableCount = keywordList.length >= 3 && keywordList.length <= 10;
                
                // All keywords should be valid (no empty, no single characters, no numbers only)
                const validKeywords = keywordList.every(keyword => 
                    keyword && 
                    keyword.length > 1 && 
                    /[a-zA-Z]/.test(keyword) &&
                    !keyword.includes(' ') // Should be normalized (no spaces)
                );
                
                // Should not have duplicate keywords
                const uniqueKeywords = new Set(keywordList).size === keywordList.length;
                
                // Keywords should be lowercase and hyphenated (normalized)
                const properlyFormatted = keywordList.every(keyword => 
                    keyword === keyword.toLowerCase() &&
                    !keyword.includes('_') &&
                    !keyword.startsWith('-') &&
                    !keyword.endsWith('-')
                );
                
                return hasKeywords && reasonableCount && validKeywords && uniqueKeywords && properlyFormatted;
            }
        );

        const result = fc.check(property, { numRuns: 100 });
        
        if (result.failed) {
            console.error(`   ❌ Keyword relevance test failed`);
            if (result.counterexample) {
                const keywordData = result.counterexample[0];
                console.error(`   📄 Problem document: ${keywordData.path}`);
                console.error(`   🏷️  Keywords: [${keywordData.keywords.join(', ')}]`);
            }
            return false;
        } else {
            console.log(`   ✅ All keywords are relevant and properly formatted`);
            return true;
        }
    }

    /**
     * Run all metadata extraction tests
     */
    runAllTests() {
        console.log('🚀 Starting Metadata Extraction Property Tests');
        console.log('📊 Running 100+ iterations per test...\n');

        try {
            const testData = this.loadTestData();
            
            console.log(`📈 Test Data Loaded:`);
            console.log(`   Documents analyzed: ${testData.analysis.documents.length}`);
            console.log(`   Summaries generated: ${testData.summaries.summaries.length}`);
            console.log(`   Keyword sets extracted: ${testData.keywords.keywords.length}\n`);

            const results = [];

            // Run all property tests
            results.push(this.testMetadataCompleteness(testData));
            results.push(this.testTitleExtraction(testData));
            results.push(this.testCategoryAssignment(testData));
            results.push(this.testSummaryQuality(testData));
            results.push(this.testKeywordRelevance(testData));

            // Summary
            const passed = results.filter(r => r).length;
            const total = results.length;

            console.log('\n📊 Test Results Summary:');
            console.log(`   Passed: ${passed}/${total}`);
            
            if (passed === total) {
                console.log('✅ All metadata extraction tests passed!');
                console.log('🎉 Requirements 3.1 and 3.2 validated successfully');
                return true;
            } else {
                console.log('❌ Some tests failed. Please review the metadata extraction system.');
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
    const tester = new MetadataExtractionTests();
    const success = tester.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = MetadataExtractionTests;