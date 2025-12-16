# Hugo Documentation Site - Quick Reference

## Overview

This project creates a Hugo static site using the Books theme to present technology documentation with enhanced navigation and content discovery features. All 53 documents are processed with metadata and organized into 4 categories.

## Quick Start

### Prerequisites
- Hugo Extended v0.152.2+ installed via winget
- Node.js for running processing scripts
- Windows PowerShell

### Essential Commands

#### Complete Site Regeneration (recommended)
```powershell
cd site/scripts
node regenerate-site.js
```
This runs the full pipeline: analyze → summarize → extract keywords → enhance front matter → copy to Hugo → build site.

#### Development Server
```powershell
cd site
$env:PATH = $env:PATH + ";C:\Users\$env:USERNAME\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe"
hugo server --buildDrafts --bind 0.0.0.0 --port 1313
```

#### Build Only (if content already processed)
```powershell
cd site/scripts
node regenerate-site.js --build-only
```

#### Validate Site
```powershell
cd site/scripts
node validate-site.js
```

#### Clean Generated Files
```powershell
cd site/scripts
node clean-site.js
```

#### Deploy to GitHub Pages
```powershell
cd site/scripts
node deploy-to-github-pages.js
```

#### Force Deploy (with uncommitted changes)
```powershell
cd site/scripts
node deploy-to-github-pages.js --force
```

## Project Structure

```
/
├── .kiro/specs/hugo-docs-site/     # Complete specifications
│   ├── requirements.md            # EARS-format requirements
│   ├── design.md                  # Technical design & correctness properties
│   └── tasks.md                   # Implementation task list
├── site/                           # Hugo site (ALL Hugo files here)
│   ├── hugo.toml                  # Hugo configuration with taxonomy
│   ├── content/docs/              # Generated documentation by category
│   │   ├── ai-ml/                 # 12 AI & ML documents
│   │   ├── devplatform/           # 22 development platform documents
│   │   ├── infrastructure/        # 18 infrastructure documents
│   │   └── workflows/             # 1 workflow document
│   ├── scripts/                   # Processing & regeneration scripts
│   │   ├── regenerate-site.js     # Main regeneration script
│   │   ├── validate-site.js       # Site validation
│   │   ├── clean-site.js          # Cleanup utility
│   │   └── *.js                   # Individual processing scripts
│   └── public/                    # Generated site (after hugo build)
├── ai/, devplatform/, etc.        # Source markdown documents (53 total)
├── PROJECT_STATUS.md              # Current progress & session context
├── CONTENT_ANALYSIS.md            # Document inventory & categories
└── AGENTS.md                      # Agent guidelines for this project
```

## Key Features Implemented

✅ **Category-based Navigation**: 4 main categories with collapsible sections
✅ **Enhanced Front Matter**: Auto-generated titles, summaries, keywords
✅ **Mermaid Diagrams**: Interactive SVG rendering enabled
✅ **Search Functionality**: Full-text search with flexsearch
✅ **Right-side TOC**: Table of contents for all documents
✅ **Taxonomy Support**: Categories and tags for filtering
✅ **Responsive Design**: Books theme with auto light/dark mode
✅ **Manual Regeneration**: Complete pipeline scripts
✅ **Property-based Testing**: Validation with fast-check library

## Site URLs

- **Development**: http://localhost:1313/musings/
- **Production**: https://lago-morph.github.io/musings/ (after deployment)

## GitHub Pages Deployment

### Prerequisites
- Git repository with clean working directory (or use `--force` flag)
- Hugo site built (public/ directory exists)
- GitHub repository with push access

### Deployment Process
1. **Build and Deploy**: `node deploy-to-github-pages.js`
2. **Configure GitHub Pages** (one-time setup):
   - Go to repository Settings → Pages
   - Set source to "Deploy from a branch"
   - Select "gh-pages" branch and "/ (root)" folder
   - Save settings
3. **Wait**: Changes appear in 2-5 minutes

### Deployment Options
- **Standard**: `node deploy-to-github-pages.js` (requires clean git status)
- **Force**: `node deploy-to-github-pages.js --force` (deploys with uncommitted changes)

### What the Script Does
1. Validates prerequisites (git repo, remote origin, clean status)
2. Builds Hugo site with `hugo --minify`
3. Creates/updates `gh-pages` branch with site content
4. Pushes to GitHub with deployment commit message
5. Adds `.nojekyll` file to disable Jekyll processing

## Document Processing Pipeline

1. **Analysis** (`content-analyzer.js`): Scans all markdown files, extracts titles
2. **Summarization** (`summary-generator.js`): Generates 2-3 sentence summaries
3. **Keywords** (`keyword-extractor.js`): Extracts relevant technical keywords
4. **Front Matter** (`front-matter-enhancer.js`): Adds YAML metadata while preserving content
5. **Organization** (`copy-to-hugo.js`): Copies to Hugo content directory by category
6. **Build** (Hugo): Generates static site with navigation and search

## Categories & Document Distribution

1. **AI & Machine Learning** (`ai-ml/`) - 12 documents
   - AI agents, LangChain, agentic computing, LLM tools
   
2. **Development Platforms** (`devplatform/`) - 22 documents  
   - GitOps workflows, Backstage, Kargo, ArgoCD, documentation platforms
   
3. **Infrastructure** (`infrastructure/`) - 18 documents
   - Kubernetes, Helm, production readiness, Crossplane, runbooks
   
4. **Workflows** (`workflows/`) - 1 document
   - Orchestration tools, automation patterns

## Troubleshooting

### Hugo not found
```powershell
$env:PATH = $env:PATH + ";C:\Users\$env:USERNAME\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe"
```

### Content not updating
Run complete regeneration:
```powershell
cd site/scripts
node regenerate-site.js
```

### Build errors
Check validation first:
```powershell
cd site/scripts
node validate-site.js
```

### Start fresh
Clean and regenerate:
```powershell
cd site/scripts
node clean-site.js
node regenerate-site.js
```

### Deployment fails
Check git status and try force deploy:
```powershell
git status
cd site/scripts
node deploy-to-github-pages.js --force
```

### Site not updating on GitHub Pages
- Wait 2-5 minutes for GitHub Pages to update
- Check GitHub repository Settings → Pages for configuration
- Verify gh-pages branch was created and pushed

## Important Notes

- **All Hugo files** must be under `/site` directory
- **Original content preserved**: Only front matter is added, never modified
- **Manual regeneration**: No automated processing, run scripts when needed
- **Property-based tests**: Use fast-check with 100+ iterations
- **Document titles**: Extracted from content, not filenames
- **Mermaid support**: Renders as interactive SVG
- **Books theme**: Configured for documentation with search and TOC

## For New Sessions

1. Read `PROJECT_STATUS.md` for current progress
2. Read `CONTENT_ANALYSIS.md` for document inventory  
3. Check `.kiro/specs/hugo-docs-site/tasks.md` for task status
4. Start Hugo server for testing: `hugo server --buildDrafts --bind 0.0.0.0 --port 1313`
5. Use `node regenerate-site.js` for complete site updates