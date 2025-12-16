#!/usr/bin/env node

/**
 * Front Matter Enhancer for Hugo Documentation Site
 * 
 * This script adds YAML front matter to documents while preserving original content.
 * It injects title, summary, keywords, category, and date metadata based on the
 * analysis results from previous processing steps.
 * 
 * Usage: node front-matter-enhancer.js
 */

const fs = require('fs');
const path = require('path');

class FrontMatterEnhancer {
    constructor() {
        this.rootDir = path.resolve(__dirname, '../..');
        this.scriptsDir = __dirname;
        this.processedFiles = [];
        this.errors = [];
    }

    /**
     * Load all analysis results
     */
    loadAnalysisData() {
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

        const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
        const summaries = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const keywords = JSON.parse(fs.readFileSync(keywordPath, 'utf8'));

        // Create lookup maps for faster access
        const summaryMap = new Map();
        summaries.summaries.forEach(s => summaryMap.set(s.path, s));

        const keywordMap = new Map();
        keywords.keywords.forEach(k => keywordMap.set(k.path, k));

        return {
            analysis,
            summaryMap,
            keywordMap,
            categories: analysis.categories
        };
    }

    /**
     * Generate front matter YAML for a document
     */
    generateFrontMatter(document, summaryData, keywordData, categories) {
        const frontMatter = {
            title: document.title,
            summary: summaryData ? summaryData.summary : 'No summary available.',
            keywords: keywordData ? keywordData.keywords : [],
            category: document.category,
            categoryName: categories[document.category] ? categories[document.category].name : 'Unknown',
            weight: categories[document.category] ? categories[document.category].weight : 999,
            date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
            draft: false,
            toc: document.hasHeaders,
            mermaid: document.hasMermaid || false
        };

        // Convert to YAML format
        let yaml = '---\n';
        yaml += `title: "${frontMatter.title.replace(/"/g, '\\"')}"\n`;
        yaml += `summary: "${frontMatter.summary.replace(/"/g, '\\"')}"\n`;
        yaml += `keywords:\n`;
        frontMatter.keywords.forEach(keyword => {
            yaml += `  - "${keyword}"\n`;
        });
        yaml += `category: "${frontMatter.category}"\n`;
        yaml += `categoryName: "${frontMatter.categoryName}"\n`;
        yaml += `weight: ${frontMatter.weight}\n`;
        yaml += `date: "${frontMatter.date}"\n`;
        yaml += `draft: ${frontMatter.draft}\n`;
        yaml += `toc: ${frontMatter.toc}\n`;
        if (frontMatter.mermaid) {
            yaml += `mermaid: true\n`;
        }
        yaml += '---\n\n';

        return yaml;
    }

    /**
     * Check if document already has front matter
     */
    hasFrontMatter(content) {
        return content.startsWith('---\n');
    }

    /**
     * Remove existing front matter from content
     */
    removeExistingFrontMatter(content) {
        if (this.hasFrontMatter(content)) {
            const endIndex = content.indexOf('\n---\n', 4);
            if (endIndex !== -1) {
                let result = content.substring(endIndex + 5); // Skip the closing ---\n
                // Remove leading empty lines
                result = result.replace(/^\n+/, '');
                return result;
            }
        }
        return content;
    }

    /**
     * Process a single document
     */
    processDocument(document, summaryMap, keywordMap, categories) {
        try {
            const filePath = path.resolve(this.rootDir, document.path);
            
            // Read original content
            const originalContent = fs.readFileSync(filePath, 'utf8');
            
            // Get metadata
            const summaryData = summaryMap.get(document.path);
            const keywordData = keywordMap.get(document.path);
            
            // Remove any existing front matter to preserve original content
            const contentWithoutFrontMatter = this.removeExistingFrontMatter(originalContent);
            
            // Generate new front matter
            const frontMatter = this.generateFrontMatter(document, summaryData, keywordData, categories);
            
            // Combine front matter with original content
            const enhancedContent = frontMatter + contentWithoutFrontMatter;
            
            // Basic verification that we preserved the original content structure
            const originalLines = contentWithoutFrontMatter.split('\n').length;
            const newBodyLines = this.removeExistingFrontMatter(enhancedContent).split('\n').length;
            
            // Allow for minor line count differences due to normalization
            if (Math.abs(originalLines - newBodyLines) > 2) {
                console.warn(`   ⚠️  Line count difference detected: ${originalLines} -> ${newBodyLines}`);
            }
            
            // Write enhanced content back to file
            fs.writeFileSync(filePath, enhancedContent, 'utf8');
            
            return {
                success: true,
                path: document.path,
                title: document.title,
                frontMatterLength: frontMatter.length,
                originalLength: originalContent.length,
                enhancedLength: enhancedContent.length
            };
            
        } catch (error) {
            return {
                success: false,
                path: document.path,
                error: error.message
            };
        }
    }

    /**
     * Simple content hash for verification (normalized)
     */
    hashContent(content) {
        // Normalize content for comparison (remove extra whitespace, normalize line endings)
        const normalized = content
            .replace(/\r\n/g, '\n') // Normalize line endings
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple blank lines
            .trim();
            
        // Simple hash function for content verification
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    /**
     * Process all documents
     */
    processAllDocuments() {
        console.log('📝 Starting front matter enhancement...');
        
        const { analysis, summaryMap, keywordMap, categories } = this.loadAnalysisData();
        
        console.log(`📊 Processing ${analysis.documents.length} documents...`);
        
        const results = {
            processed: [],
            statistics: {
                total: 0,
                successful: 0,
                failed: 0,
                totalFrontMatterAdded: 0,
                averageFrontMatterSize: 0
            }
        };
        
        for (const document of analysis.documents) {
            console.log(`   Processing: ${document.path}`);
            
            const result = this.processDocument(document, summaryMap, keywordMap, categories);
            results.processed.push(result);
            results.statistics.total++;
            
            if (result.success) {
                results.statistics.successful++;
                results.statistics.totalFrontMatterAdded += result.frontMatterLength;
                this.processedFiles.push(result.path);
            } else {
                results.statistics.failed++;
                this.errors.push(result);
                console.error(`     ❌ Failed: ${result.error}`);
            }
        }
        
        // Calculate statistics
        if (results.statistics.successful > 0) {
            results.statistics.averageFrontMatterSize = Math.round(
                results.statistics.totalFrontMatterAdded / results.statistics.successful
            );
        }
        
        return results;
    }

    /**
     * Create backup of original files
     */
    createBackup() {
        const backupDir = path.join(this.scriptsDir, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        console.log('💾 Creating backup of original files...');
        
        const { analysis } = this.loadAnalysisData();
        let backedUp = 0;
        
        for (const document of analysis.documents) {
            try {
                const originalPath = path.resolve(this.rootDir, document.path);
                const backupPath = path.join(backupDir, document.path.replace(/[\/\\]/g, '_'));
                
                if (fs.existsSync(originalPath)) {
                    fs.copyFileSync(originalPath, backupPath);
                    backedUp++;
                }
            } catch (error) {
                console.warn(`   ⚠️  Failed to backup ${document.path}: ${error.message}`);
            }
        }
        
        console.log(`   ✅ Backed up ${backedUp} files to ${backupDir}`);
        return backupDir;
    }

    /**
     * Restore from backup
     */
    restoreFromBackup() {
        const backupDir = path.join(this.scriptsDir, 'backups');
        if (!fs.existsSync(backupDir)) {
            console.error('❌ No backup directory found');
            return false;
        }
        
        console.log('🔄 Restoring from backup...');
        
        const { analysis } = this.loadAnalysisData();
        let restored = 0;
        
        for (const document of analysis.documents) {
            try {
                const originalPath = path.resolve(this.rootDir, document.path);
                const backupPath = path.join(backupDir, document.path.replace(/[\/\\]/g, '_'));
                
                if (fs.existsSync(backupPath)) {
                    fs.copyFileSync(backupPath, originalPath);
                    restored++;
                }
            } catch (error) {
                console.warn(`   ⚠️  Failed to restore ${document.path}: ${error.message}`);
            }
        }
        
        console.log(`   ✅ Restored ${restored} files from backup`);
        return true;
    }

    /**
     * Save processing results
     */
    saveResults(results) {
        const outputPath = path.join(this.scriptsDir, 'front-matter-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`💾 Results saved to: ${outputPath}`);
        return outputPath;
    }
}

// Main execution
if (require.main === module) {
    const enhancer = new FrontMatterEnhancer();
    
    try {
        // Check command line arguments
        const args = process.argv.slice(2);
        
        if (args.includes('--restore')) {
            enhancer.restoreFromBackup();
            process.exit(0);
        }
        
        if (args.includes('--backup-only')) {
            enhancer.createBackup();
            process.exit(0);
        }
        
        // Create backup before processing
        const backupDir = enhancer.createBackup();
        
        // Process all documents
        const results = enhancer.processAllDocuments();
        
        console.log('\n📊 Front Matter Enhancement Results:');
        console.log(`   Total documents: ${results.statistics.total}`);
        console.log(`   Successfully processed: ${results.statistics.successful}`);
        console.log(`   Failed: ${results.statistics.failed}`);
        console.log(`   Average front matter size: ${results.statistics.averageFrontMatterSize} characters`);
        
        if (results.statistics.failed > 0) {
            console.log('\n❌ Failed documents:');
            enhancer.errors.forEach(error => {
                console.log(`   ${error.path}: ${error.error}`);
            });
        }
        
        enhancer.saveResults(results);
        
        if (results.statistics.successful === results.statistics.total) {
            console.log('\n✅ All documents enhanced successfully!');
            console.log(`💾 Backup available at: ${backupDir}`);
            console.log('🔄 To restore originals, run: node front-matter-enhancer.js --restore');
        } else {
            console.log('\n⚠️  Some documents failed to process. Check the results for details.');
        }
        
    } catch (error) {
        console.error('❌ Front matter enhancement failed:', error.message);
        process.exit(1);
    }
}

module.exports = FrontMatterEnhancer;