#!/usr/bin/env node

/**
 * Document Content Analyzer for Hugo Documentation Site
 * 
 * This script analyzes all markdown documents in the repository to:
 * 1. Extract document titles from content (first header or filename fallback)
 * 2. Analyze content for theme detection and categorization
 * 3. Prepare data for summary and keyword generation
 * 
 * Usage: node content-analyzer.js
 */

const fs = require('fs');
const path = require('path');

class DocumentAnalyzer {
    constructor() {
        this.rootDir = path.resolve(__dirname, '../..');
        this.excludePatterns = [
            /^\./, // Hidden files/directories
            /node_modules/,
            /\.git/,
            /site\/public/,
            /site\/resources/,
            /site\/themes/, // Exclude all theme files
            /site\/archetypes/, // Exclude Hugo archetypes
            /site\/content\/docs\/.*\.md$/, // Exclude our test documents
            /README\.md$/,
            /AGENTS\.md$/,
            /CONTENT_ANALYSIS\.md$/,
            /PROJECT_STATUS\.md$/,
            /QUICK_REFERENCE\.md$/,
            /HISTORICAL_PROMPT\.md$/
        ];
        
        // Category definitions based on content analysis
        this.categories = {
            'ai-ml': {
                name: 'AI & Machine Learning',
                description: 'Information about AI agents, machine learning tools, and frameworks',
                keywords: ['ai', 'agent', 'langchain', 'llm', 'machine-learning', 'agentic', 'temporal', 'prefect'],
                weight: 1
            },
            'devplatform': {
                name: 'Development Platforms',
                description: 'Documentation platforms, GitOps workflows, and development infrastructure',
                keywords: ['backstage', 'gitops', 'argocd', 'kargo', 'documentation', 'techdocs', 'crossplane'],
                weight: 2
            },
            'infrastructure': {
                name: 'Infrastructure',
                description: 'Kubernetes, Helm, production readiness, and infrastructure management',
                keywords: ['kubernetes', 'helm', 'production', 'docker', 'observability', 'runbooks', 'eks'],
                weight: 3
            },
            'workflows': {
                name: 'Workflows',
                description: 'Orchestration tools, automation patterns, and workflow management',
                keywords: ['workflow', 'orchestration', 'automation', 'serverless', 'n8n'],
                weight: 4
            }
        };
    }

    /**
     * Find all markdown files in the repository
     */
    findMarkdownFiles() {
        const files = [];
        
        // Only include specific directories with actual documentation
        const includeDirs = [
            'ai',
            'devplatform', 
            'domainmodel',
            'eks_crossplane',
            'helm',
            'production',
            'workflow'
        ];
        
        const walkDir = (dir, isIncludedDir = false) => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relativePath = path.relative(this.rootDir, fullPath);
                
                // Skip excluded patterns
                if (this.excludePatterns.some(pattern => pattern.test(relativePath))) {
                    continue;
                }
                
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Check if this is one of our included directories
                    const isTargetDir = includeDirs.includes(item);
                    walkDir(fullPath, isTargetDir || isIncludedDir);
                } else if (stat.isFile() && item.endsWith('.md') && isIncludedDir) {
                    files.push({
                        fullPath,
                        relativePath,
                        filename: item
                    });
                }
            }
        };
        
        walkDir(this.rootDir);
        return files;
    }

    /**
     * Extract title from markdown content
     */
    extractTitle(content, filename) {
        // Remove front matter first
        const withoutFrontMatter = content.replace(/^---[\s\S]*?---\n/, '');
        
        // Look for first # header
        const headerMatch = withoutFrontMatter.match(/^#\s+(.+)$/m);
        if (headerMatch) {
            let title = headerMatch[1].trim();
            // Clean up markdown formatting in titles
            title = title.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold
            title = title.replace(/\*([^*]+)\*/g, '$1'); // Remove italic
            title = title.replace(/`([^`]+)`/g, '$1'); // Remove code
            title = title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links
            
            // If title is too generic, short, starts with a number, or looks like a file path, try to find a better one
            if (title.length < 4 || 
                ['prompt', 'title', 'readme', 'index'].includes(title.toLowerCase()) ||
                /^\d+\./.test(title) || // Starts with number and dot
                title.includes('/') || // Contains file path separators
                title.includes('.yaml') || title.includes('.yml') || // File extensions
                title.includes('.json') || title.includes('.md')) {
                // Look for second header or a more descriptive header
                const allHeaders = withoutFrontMatter.match(/^#+\s+(.+)$/gm) || [];
                for (const header of allHeaders.slice(1)) { // Skip first header
                    let headerText = header.replace(/^#+\s+/, '').trim();
                    // Clean markdown formatting from header text too
                    headerText = headerText.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold
                    headerText = headerText.replace(/\*([^*]+)\*/g, '$1'); // Remove italic
                    headerText = headerText.replace(/`([^`]+)`/g, '$1'); // Remove code
                    headerText = headerText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links
                    
                    if (headerText.length > 4 && 
                        !['prompt', 'title', 'readme', 'index'].includes(headerText.toLowerCase()) &&
                        !/^\d+\./.test(headerText) && // Not starting with number and dot
                        !headerText.includes('/') && // Not a file path
                        !headerText.includes('.yaml') && !headerText.includes('.yml') &&
                        !headerText.includes('.json') && !headerText.includes('.md')) {
                        title = headerText;
                        break;
                    }
                }
                
                // If still generic or starts with number, use filename
                if (title.length < 4 || 
                    ['prompt', 'title', 'readme', 'index'].includes(title.toLowerCase()) ||
                    /^\d+\./.test(title) ||
                    title.includes('(what') || title.includes('(Important') || // Parenthetical descriptions
                    title.includes('/') || title.includes('.yaml') || title.includes('.yml') ||
                    title.includes('.json') || title.includes('.md')) {
                    const baseName = path.basename(filename, '.md');
                    title = this.formatTitle(baseName);
                }
            }
            
            return title.trim();
        }
        
        // Look for title in front matter
        const titleMatch = content.match(/^title:\s*["']?([^"'\n]+)["']?$/m);
        if (titleMatch) {
            return titleMatch[1].trim();
        }
        
        // Fallback to filename without extension and path
        const baseName = path.basename(filename, '.md');
        return this.formatTitle(baseName);
    }

    /**
     * Format filename to title case
     */
    formatTitle(filename) {
        return filename
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Analyze content to determine category
     */
    analyzeCategory(content, relativePath) {
        const contentLower = content.toLowerCase();
        const pathLower = relativePath.toLowerCase();
        
        // Score each category based on keyword matches
        const scores = {};
        
        for (const [categoryId, category] of Object.entries(this.categories)) {
            let score = 0;
            
            // Check content for keywords
            for (const keyword of category.keywords) {
                const keywordRegex = new RegExp(`\\b${keyword.replace('-', '[-_]?')}`, 'gi');
                const matches = (content.match(keywordRegex) || []).length;
                score += matches * 2; // Content matches worth more
            }
            
            // Check path for keywords
            for (const keyword of category.keywords) {
                if (pathLower.includes(keyword.replace('-', ''))) {
                    score += 1; // Path matches worth less
                }
            }
            
            scores[categoryId] = score;
        }
        
        // Find category with highest score
        const bestCategory = Object.entries(scores)
            .reduce((best, [id, score]) => score > best.score ? {id, score} : best, {id: 'infrastructure', score: 0});
        
        return bestCategory.id;
    }

    /**
     * Extract content themes for summary generation
     */
    extractThemes(content) {
        const themes = [];
        
        // Extract headers as themes
        const headers = content.match(/^#{1,3}\s+(.+)$/gm) || [];
        themes.push(...headers.map(h => h.replace(/^#+\s+/, '').trim()));
        
        // Extract first paragraph as introduction
        const paragraphs = content.split('\n\n').filter(p => 
            p.trim() && 
            !p.startsWith('#') && 
            !p.startsWith('```') &&
            !p.startsWith('|') // Skip tables
        );
        
        if (paragraphs.length > 0) {
            themes.push(paragraphs[0].trim());
        }
        
        return themes;
    }

    /**
     * Analyze a single document
     */
    analyzeDocument(file) {
        try {
            const content = fs.readFileSync(file.fullPath, 'utf8');
            
            const analysis = {
                path: file.relativePath,
                filename: file.filename,
                title: this.extractTitle(content, file.filename),
                category: this.analyzeCategory(content, file.relativePath),
                themes: this.extractThemes(content),
                contentLength: content.length,
                hasHeaders: /^#+\s+/m.test(content),
                hasMermaid: /```mermaid/i.test(content),
                hasCodeBlocks: /```/.test(content),
                wordCount: content.split(/\s+/).length
            };
            
            return analysis;
        } catch (error) {
            console.error(`Error analyzing ${file.relativePath}:`, error.message);
            return null;
        }
    }

    /**
     * Analyze all documents in the repository
     */
    analyzeAll() {
        console.log('🔍 Starting document analysis...');
        
        const files = this.findMarkdownFiles();
        console.log(`📄 Found ${files.length} markdown files`);
        
        const analyses = [];
        
        for (const file of files) {
            console.log(`   Analyzing: ${file.relativePath}`);
            const analysis = this.analyzeDocument(file);
            if (analysis) {
                analyses.push(analysis);
            }
        }
        
        // Generate summary statistics
        const stats = this.generateStats(analyses);
        
        return {
            documents: analyses,
            statistics: stats,
            categories: this.categories
        };
    }

    /**
     * Generate analysis statistics
     */
    generateStats(analyses) {
        const stats = {
            totalDocuments: analyses.length,
            categoryCounts: {},
            averageWordCount: 0,
            documentsWithMermaid: 0,
            documentsWithHeaders: 0
        };
        
        // Count by category
        for (const analysis of analyses) {
            stats.categoryCounts[analysis.category] = (stats.categoryCounts[analysis.category] || 0) + 1;
            if (analysis.hasMermaid) stats.documentsWithMermaid++;
            if (analysis.hasHeaders) stats.documentsWithHeaders++;
        }
        
        // Calculate average word count
        const totalWords = analyses.reduce((sum, doc) => sum + doc.wordCount, 0);
        stats.averageWordCount = Math.round(totalWords / analyses.length);
        
        return stats;
    }

    /**
     * Save analysis results to JSON file
     */
    saveResults(results) {
        const outputPath = path.join(__dirname, 'analysis-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`💾 Analysis results saved to: ${outputPath}`);
        return outputPath;
    }
}

// Main execution
if (require.main === module) {
    const analyzer = new DocumentAnalyzer();
    
    try {
        const results = analyzer.analyzeAll();
        
        console.log('\n📊 Analysis Summary:');
        console.log(`   Total documents: ${results.statistics.totalDocuments}`);
        console.log(`   Average word count: ${results.statistics.averageWordCount}`);
        console.log(`   Documents with Mermaid: ${results.statistics.documentsWithMermaid}`);
        console.log(`   Documents with headers: ${results.statistics.documentsWithHeaders}`);
        
        console.log('\n📂 Documents by category:');
        for (const [categoryId, count] of Object.entries(results.statistics.categoryCounts)) {
            const categoryName = results.categories[categoryId].name;
            console.log(`   ${categoryName}: ${count}`);
        }
        
        analyzer.saveResults(results);
        
        console.log('\n✅ Document analysis complete!');
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

module.exports = DocumentAnalyzer;