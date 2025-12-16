#!/usr/bin/env node

/**
 * Summary Generator for Hugo Documentation Site
 * 
 * This script generates 2-3 sentence summaries from document content.
 * It analyzes document structure and content to create meaningful summaries
 * that help users understand what each document covers.
 * 
 * Usage: node summary-generator.js [analysis-results.json]
 */

const fs = require('fs');
const path = require('path');

class SummaryGenerator {
    constructor() {
        this.rootDir = path.resolve(__dirname, '../..');
    }

    /**
     * Load analysis results from content analyzer
     */
    loadAnalysisResults(filePath = 'analysis-results.json') {
        const fullPath = path.resolve(__dirname, filePath);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Analysis results file not found: ${fullPath}`);
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(content);
    }

    /**
     * Read document content
     */
    readDocument(relativePath) {
        const fullPath = path.resolve(this.rootDir, relativePath);
        return fs.readFileSync(fullPath, 'utf8');
    }

    /**
     * Extract the introduction/overview section from content
     */
    extractIntroduction(content) {
        // Remove front matter if present
        const withoutFrontMatter = content.replace(/^---[\s\S]*?---\n/, '');
        
        // Split into sections by headers
        const sections = withoutFrontMatter.split(/^#+\s+/m);
        
        // Get content before first header or first section
        let intro = sections[0].trim();
        
        // If intro is too short, try to get more content
        if (intro.length < 100 && sections.length > 1) {
            // Look for overview, introduction, or similar sections
            for (let i = 1; i < sections.length; i++) {
                const section = sections[i];
                const headerMatch = section.match(/^([^\n]+)\n([\s\S]*)/);
                if (headerMatch) {
                    const [, header, sectionContent] = headerMatch;
                    if (/overview|introduction|about|summary/i.test(header)) {
                        intro = sectionContent.trim();
                        break;
                    }
                }
            }
        }
        
        return intro;
    }

    /**
     * Extract key topics from headers
     */
    extractKeyTopics(content) {
        const headers = content.match(/^#{1,3}\s+(.+)$/gm) || [];
        return headers
            .map(h => h.replace(/^#+\s+/, '').trim())
            .filter(h => h.length > 0)
            .slice(0, 5); // Top 5 topics
    }

    /**
     * Clean and normalize text for summary generation
     */
    cleanText(text) {
        return text
            // Remove markdown formatting
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
            .replace(/\*([^*]+)\*/g, '$1') // Italic
            .replace(/`([^`]+)`/g, '$1') // Inline code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
            // Remove code blocks
            .replace(/```[\s\S]*?```/g, '')
            // Remove tables
            .replace(/^\|.*\|$/gm, '')
            // Remove excessive whitespace
            .replace(/\n\s*\n/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extract sentences from text
     */
    extractSentences(text) {
        // Split on sentence boundaries
        const sentences = text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10) // Filter out very short fragments
            .map(s => s.charAt(0).toUpperCase() + s.slice(1)); // Capitalize first letter
        
        return sentences;
    }

    /**
     * Generate summary for a document
     */
    generateSummary(analysis) {
        try {
            const content = this.readDocument(analysis.path);
            const introduction = this.extractIntroduction(content);
            const keyTopics = this.extractKeyTopics(content);
            
            // Clean the introduction text
            const cleanIntro = this.cleanText(introduction);
            
            // Extract sentences from introduction
            const sentences = this.extractSentences(cleanIntro);
            
            let summary = '';
            
            if (sentences.length >= 2) {
                // Use first 2-3 sentences from introduction
                summary = sentences.slice(0, 3).join('. ') + '.';
            } else if (sentences.length === 1) {
                // Single sentence intro, add topic information
                const topicInfo = keyTopics.length > 0 
                    ? ` Covers ${keyTopics.slice(0, 3).join(', ')}.`
                    : '';
                summary = sentences[0] + '.' + topicInfo;
            } else {
                // No good introduction, generate from title and topics
                summary = this.generateFallbackSummary(analysis, keyTopics);
            }
            
            // Ensure summary is reasonable length (50-150 words)
            const words = summary.split(/\s+/);
            if (words.length > 150) {
                // Truncate to approximately 2 sentences
                const truncated = words.slice(0, 100).join(' ');
                const lastPeriod = truncated.lastIndexOf('.');
                summary = lastPeriod > 50 ? truncated.substring(0, lastPeriod + 1) : truncated + '.';
            }
            
            return {
                success: true,
                summary: summary,
                wordCount: summary.split(/\s+/).length,
                method: sentences.length >= 2 ? 'introduction' : sentences.length === 1 ? 'intro+topics' : 'fallback'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                summary: this.generateFallbackSummary(analysis, [])
            };
        }
    }

    /**
     * Generate fallback summary when content analysis fails
     */
    generateFallbackSummary(analysis, topics) {
        const categoryName = this.getCategoryName(analysis.category);
        const topicText = topics.length > 0 ? ` covering ${topics.slice(0, 2).join(' and ')}` : '';
        
        return `${analysis.title} is a ${categoryName.toLowerCase()} document${topicText}. ` +
               `This resource provides information and guidance on the topic. ` +
               `See the full document for detailed information and implementation details.`;
    }

    /**
     * Get category display name
     */
    getCategoryName(categoryId) {
        const categories = {
            'ai-ml': 'AI & Machine Learning',
            'devplatform': 'Development Platform',
            'infrastructure': 'Infrastructure',
            'workflows': 'Workflow'
        };
        return categories[categoryId] || 'Technical';
    }

    /**
     * Process all documents and generate summaries
     */
    generateAllSummaries(analysisResults) {
        console.log('📝 Starting summary generation...');
        
        const results = {
            summaries: [],
            statistics: {
                total: 0,
                successful: 0,
                failed: 0,
                methods: {
                    introduction: 0,
                    'intro+topics': 0,
                    fallback: 0
                },
                averageWordCount: 0
            }
        };
        
        for (const analysis of analysisResults.documents) {
            console.log(`   Generating summary: ${analysis.path}`);
            
            const summaryResult = this.generateSummary(analysis);
            
            const documentSummary = {
                path: analysis.path,
                title: analysis.title,
                category: analysis.category,
                summary: summaryResult.summary,
                wordCount: summaryResult.wordCount || 0,
                method: summaryResult.method || 'fallback',
                success: summaryResult.success
            };
            
            results.summaries.push(documentSummary);
            results.statistics.total++;
            
            if (summaryResult.success) {
                results.statistics.successful++;
                results.statistics.methods[summaryResult.method]++;
            } else {
                results.statistics.failed++;
                console.warn(`     ⚠️  Failed: ${summaryResult.error}`);
            }
        }
        
        // Calculate average word count
        const totalWords = results.summaries.reduce((sum, s) => sum + s.wordCount, 0);
        results.statistics.averageWordCount = Math.round(totalWords / results.summaries.length);
        
        return results;
    }

    /**
     * Save summary results to JSON file
     */
    saveResults(results) {
        const outputPath = path.join(__dirname, 'summary-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`💾 Summary results saved to: ${outputPath}`);
        return outputPath;
    }
}

// Main execution
if (require.main === module) {
    const generator = new SummaryGenerator();
    
    try {
        const analysisFile = process.argv[2] || 'analysis-results.json';
        const analysisResults = generator.loadAnalysisResults(analysisFile);
        
        const summaryResults = generator.generateAllSummaries(analysisResults);
        
        console.log('\n📊 Summary Generation Results:');
        console.log(`   Total documents: ${summaryResults.statistics.total}`);
        console.log(`   Successful: ${summaryResults.statistics.successful}`);
        console.log(`   Failed: ${summaryResults.statistics.failed}`);
        console.log(`   Average word count: ${summaryResults.statistics.averageWordCount}`);
        
        console.log('\n📝 Generation methods:');
        for (const [method, count] of Object.entries(summaryResults.statistics.methods)) {
            console.log(`   ${method}: ${count}`);
        }
        
        generator.saveResults(summaryResults);
        
        console.log('\n✅ Summary generation complete!');
        
    } catch (error) {
        console.error('❌ Summary generation failed:', error.message);
        process.exit(1);
    }
}

module.exports = SummaryGenerator;