#!/usr/bin/env node

/**
 * Keyword Extractor for Hugo Documentation Site
 * 
 * This script extracts relevant keywords from document content for taxonomy.
 * It analyzes technical terms, tool names, and concepts to create useful
 * keywords for filtering and categorization.
 * 
 * Usage: node keyword-extractor.js [analysis-results.json]
 */

const fs = require('fs');
const path = require('path');

class KeywordExtractor {
    constructor() {
        this.rootDir = path.resolve(__dirname, '../..');
        
        // Common technical terms and tools to recognize
        this.technicalTerms = new Set([
            // AI/ML terms
            'ai', 'artificial-intelligence', 'machine-learning', 'llm', 'large-language-model',
            'agent', 'agentic', 'langchain', 'langgraph', 'temporal', 'prefect', 'react-pattern',
            'multi-agent', 'orchestration', 'workflow', 'automation', 'observability', 'tracing',
            
            // DevOps/Platform terms
            'kubernetes', 'k8s', 'docker', 'container', 'helm', 'argocd', 'gitops', 'kargo',
            'crossplane', 'backstage', 'techdocs', 'documentation', 'platform', 'devops',
            'ci-cd', 'continuous-integration', 'continuous-deployment', 'infrastructure',
            
            // Development terms
            'api', 'rest', 'graphql', 'microservices', 'serverless', 'function', 'lambda',
            'database', 'sql', 'nosql', 'monitoring', 'logging', 'metrics', 'alerting',
            
            // Cloud/Infrastructure
            'aws', 'azure', 'gcp', 'cloud', 'eks', 'aks', 'gke', 'terraform', 'ansible',
            'production', 'staging', 'deployment', 'scaling', 'load-balancing', 'security',
            
            // Tools and frameworks
            'react', 'vue', 'angular', 'nodejs', 'python', 'java', 'golang', 'rust',
            'typescript', 'javascript', 'json', 'yaml', 'toml', 'markdown', 'mermaid'
        ]);
        
        // Stop words to exclude
        this.stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
            'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'me',
            'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
            'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
            'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what',
            'which', 'who', 'whom', 'whose', 'this', 'that', 'these', 'those', 'am', 'is',
            'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
            'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 'may', 'might',
            'must', 'can', 'shall', 'need', 'want', 'get', 'got', 'make', 'made', 'take',
            'took', 'come', 'came', 'go', 'went', 'see', 'saw', 'know', 'knew', 'think',
            'thought', 'say', 'said', 'tell', 'told', 'ask', 'asked', 'work', 'worked',
            'seem', 'seemed', 'feel', 'felt', 'try', 'tried', 'leave', 'left', 'call',
            'called', 'move', 'moved', 'live', 'lived', 'believe', 'believed', 'hold',
            'held', 'bring', 'brought', 'happen', 'happened', 'write', 'wrote', 'provide',
            'provided', 'sit', 'sat', 'stand', 'stood', 'lose', 'lost', 'add', 'added',
            'change', 'changed', 'play', 'played', 'run', 'ran', 'move', 'moved', 'like',
            'liked', 'back', 'over', 'also', 'around', 'just', 'where', 'how', 'when',
            'why', 'here', 'there', 'now', 'then', 'more', 'most', 'other', 'some', 'time',
            'very', 'well', 'way', 'even', 'new', 'old', 'good', 'great', 'right', 'still',
            'own', 'under', 'last', 'never', 'place', 'same', 'another', 'while', 'where',
            'much', 'too', 'any', 'may', 'say', 'each', 'which', 'she', 'all', 'there',
            'use', 'her', 'many', 'day', 'them', 'these', 'way', 'been', 'call', 'who',
            'oil', 'sit', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'has',
            'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'who', 'boy',
            'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
        ]);
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
     * Normalize text for keyword extraction
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            // Convert various separators to hyphens
            .replace(/[_\s]+/g, '-')
            // Remove special characters except hyphens
            .replace(/[^a-z0-9-]/g, '')
            // Remove multiple hyphens
            .replace(/-+/g, '-')
            // Remove leading/trailing hyphens
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Extract technical terms from content
     */
    extractTechnicalTerms(content) {
        const terms = new Set();
        
        // Extract code blocks and inline code
        const codeMatches = content.match(/`([^`]+)`/g) || [];
        for (const match of codeMatches) {
            const term = this.normalizeText(match.replace(/`/g, ''));
            if (term && this.technicalTerms.has(term)) {
                terms.add(term);
            }
        }
        
        // Extract from headers
        const headers = content.match(/^#+\s+(.+)$/gm) || [];
        for (const header of headers) {
            const headerText = header.replace(/^#+\s+/, '');
            const words = headerText.split(/\s+/);
            for (const word of words) {
                const term = this.normalizeText(word);
                if (term && this.technicalTerms.has(term)) {
                    terms.add(term);
                }
            }
        }
        
        // Extract from regular text
        const words = content.split(/\s+/);
        for (const word of words) {
            const term = this.normalizeText(word);
            if (term && this.technicalTerms.has(term)) {
                terms.add(term);
            }
        }
        
        return Array.from(terms);
    }

    /**
     * Extract domain-specific keywords from content
     */
    extractDomainKeywords(content, category) {
        const keywords = new Set();
        
        // Category-specific keyword patterns
        const categoryPatterns = {
            'ai-ml': [
                /\b(agent|agentic|llm|langchain|langgraph|temporal|prefect|ai|ml|machine.?learning|artificial.?intelligence|react.?pattern|multi.?agent|orchestration|workflow|automation|observability|tracing|metrics)\b/gi
            ],
            'devplatform': [
                /\b(backstage|techdocs|gitops|argocd|kargo|crossplane|platform|devops|ci.?cd|continuous.?integration|continuous.?deployment|documentation|docs.?as.?code|wiki|confluence|mkdocs)\b/gi
            ],
            'infrastructure': [
                /\b(kubernetes|k8s|docker|container|helm|production|staging|deployment|scaling|load.?balancing|security|monitoring|logging|alerting|infrastructure|cloud|aws|azure|gcp|eks|aks|gke|terraform|ansible)\b/gi
            ],
            'workflows': [
                /\b(workflow|orchestration|automation|serverless|function|lambda|n8n|airflow|temporal|prefect|process|task|job|pipeline|trigger|event)\b/gi
            ]
        };
        
        const patterns = categoryPatterns[category] || [];
        
        for (const pattern of patterns) {
            const matches = content.match(pattern) || [];
            for (const match of matches) {
                const keyword = this.normalizeText(match);
                if (keyword && keyword.length > 2) {
                    keywords.add(keyword);
                }
            }
        }
        
        return Array.from(keywords);
    }

    /**
     * Extract keywords from file path
     */
    extractPathKeywords(relativePath) {
        const keywords = new Set();
        
        // Split path into components
        const pathParts = relativePath.split(/[\/\\]/);
        
        for (const part of pathParts) {
            // Skip common directory names
            if (['docs', 'content', 'site', 'themes', 'book'].includes(part)) {
                continue;
            }
            
            // Extract meaningful path components
            const normalized = this.normalizeText(part.replace(/\.md$/, ''));
            if (normalized && normalized.length > 2 && !this.stopWords.has(normalized)) {
                keywords.add(normalized);
            }
        }
        
        return Array.from(keywords);
    }

    /**
     * Score and rank keywords by relevance
     */
    scoreKeywords(keywords, content, title) {
        const scores = {};
        const contentLower = content.toLowerCase();
        const titleLower = title.toLowerCase();
        
        for (const keyword of keywords) {
            let score = 0;
            
            // Base score for being a recognized technical term
            if (this.technicalTerms.has(keyword)) {
                score += 10;
            }
            
            // Score based on frequency in content
            const keywordRegex = new RegExp(`\\b${keyword.replace('-', '[-_\\s]?')}`, 'gi');
            const contentMatches = (content.match(keywordRegex) || []).length;
            score += contentMatches * 2;
            
            // Bonus for appearing in title
            if (titleLower.includes(keyword.replace('-', ''))) {
                score += 5;
            }
            
            // Bonus for keyword length (longer = more specific)
            score += Math.min(keyword.length / 3, 3);
            
            scores[keyword] = score;
        }
        
        // Sort by score and return top keywords
        return Object.entries(scores)
            .sort(([,a], [,b]) => b - a)
            .map(([keyword]) => keyword);
    }

    /**
     * Extract keywords for a document
     */
    extractKeywords(analysis) {
        try {
            const content = this.readDocument(analysis.path);
            
            // Collect keywords from different sources
            const allKeywords = new Set();
            
            // Technical terms from content
            const technicalTerms = this.extractTechnicalTerms(content);
            technicalTerms.forEach(term => allKeywords.add(term));
            
            // Domain-specific keywords
            const domainKeywords = this.extractDomainKeywords(content, analysis.category);
            domainKeywords.forEach(keyword => allKeywords.add(keyword));
            
            // Path-based keywords
            const pathKeywords = this.extractPathKeywords(analysis.path);
            pathKeywords.forEach(keyword => allKeywords.add(keyword));
            
            // Score and rank keywords
            const rankedKeywords = this.scoreKeywords(Array.from(allKeywords), content, analysis.title);
            
            // Return top 8 keywords
            const finalKeywords = rankedKeywords.slice(0, 8);
            
            return {
                success: true,
                keywords: finalKeywords,
                totalFound: allKeywords.size,
                sources: {
                    technical: technicalTerms.length,
                    domain: domainKeywords.length,
                    path: pathKeywords.length
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                keywords: this.generateFallbackKeywords(analysis)
            };
        }
    }

    /**
     * Generate fallback keywords when extraction fails
     */
    generateFallbackKeywords(analysis) {
        const fallbackKeywords = [];
        
        // Add category-based keywords
        const categoryKeywords = {
            'ai-ml': ['ai', 'machine-learning', 'automation'],
            'devplatform': ['platform', 'development', 'documentation'],
            'infrastructure': ['infrastructure', 'kubernetes', 'production'],
            'workflows': ['workflow', 'orchestration', 'automation']
        };
        
        const categoryDefaults = categoryKeywords[analysis.category] || ['technical', 'documentation'];
        fallbackKeywords.push(...categoryDefaults);
        
        // Add path-based keywords
        const pathKeywords = this.extractPathKeywords(analysis.path);
        fallbackKeywords.push(...pathKeywords.slice(0, 3));
        
        return fallbackKeywords.slice(0, 6);
    }

    /**
     * Process all documents and extract keywords
     */
    extractAllKeywords(analysisResults) {
        console.log('🏷️  Starting keyword extraction...');
        
        const results = {
            keywords: [],
            statistics: {
                total: 0,
                successful: 0,
                failed: 0,
                averageKeywordCount: 0,
                totalUniqueKeywords: 0,
                sources: {
                    technical: 0,
                    domain: 0,
                    path: 0
                }
            },
            allKeywords: new Set()
        };
        
        for (const analysis of analysisResults.documents) {
            console.log(`   Extracting keywords: ${analysis.path}`);
            
            const keywordResult = this.extractKeywords(analysis);
            
            const documentKeywords = {
                path: analysis.path,
                title: analysis.title,
                category: analysis.category,
                keywords: keywordResult.keywords,
                keywordCount: keywordResult.keywords.length,
                success: keywordResult.success,
                sources: keywordResult.sources || {}
            };
            
            results.keywords.push(documentKeywords);
            results.statistics.total++;
            
            // Add to global keyword set
            keywordResult.keywords.forEach(keyword => results.allKeywords.add(keyword));
            
            if (keywordResult.success) {
                results.statistics.successful++;
                if (keywordResult.sources) {
                    results.statistics.sources.technical += keywordResult.sources.technical || 0;
                    results.statistics.sources.domain += keywordResult.sources.domain || 0;
                    results.statistics.sources.path += keywordResult.sources.path || 0;
                }
            } else {
                results.statistics.failed++;
                console.warn(`     ⚠️  Failed: ${keywordResult.error}`);
            }
        }
        
        // Calculate statistics
        const totalKeywords = results.keywords.reduce((sum, doc) => sum + doc.keywordCount, 0);
        results.statistics.averageKeywordCount = Math.round(totalKeywords / results.keywords.length);
        results.statistics.totalUniqueKeywords = results.allKeywords.size;
        
        // Convert Set to Array for JSON serialization
        results.allKeywords = Array.from(results.allKeywords).sort();
        
        return results;
    }

    /**
     * Save keyword results to JSON file
     */
    saveResults(results) {
        const outputPath = path.join(__dirname, 'keyword-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`💾 Keyword results saved to: ${outputPath}`);
        return outputPath;
    }
}

// Main execution
if (require.main === module) {
    const extractor = new KeywordExtractor();
    
    try {
        const analysisFile = process.argv[2] || 'analysis-results.json';
        const analysisResults = extractor.loadAnalysisResults(analysisFile);
        
        const keywordResults = extractor.extractAllKeywords(analysisResults);
        
        console.log('\n📊 Keyword Extraction Results:');
        console.log(`   Total documents: ${keywordResults.statistics.total}`);
        console.log(`   Successful: ${keywordResults.statistics.successful}`);
        console.log(`   Failed: ${keywordResults.statistics.failed}`);
        console.log(`   Average keywords per document: ${keywordResults.statistics.averageKeywordCount}`);
        console.log(`   Total unique keywords: ${keywordResults.statistics.totalUniqueKeywords}`);
        
        console.log('\n🏷️  Keyword sources:');
        console.log(`   Technical terms: ${keywordResults.statistics.sources.technical}`);
        console.log(`   Domain keywords: ${keywordResults.statistics.sources.domain}`);
        console.log(`   Path keywords: ${keywordResults.statistics.sources.path}`);
        
        extractor.saveResults(keywordResults);
        
        console.log('\n✅ Keyword extraction complete!');
        
    } catch (error) {
        console.error('❌ Keyword extraction failed:', error.message);
        process.exit(1);
    }
}

module.exports = KeywordExtractor;