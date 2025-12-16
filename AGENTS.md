# Agent Guidelines for Hugo Documentation Site Project

## Project Overview

This project creates a Hugo static site using the Books theme to present technology documentation with enhanced navigation and content discovery features.

## Essential Context Files

**Read these files before starting work in a new session:**
- `.kiro/specs/hugo-docs-site/requirements.md` - Complete requirements specification
- `.kiro/specs/hugo-docs-site/design.md` - System design and architecture
- `.kiro/specs/hugo-docs-site/tasks.md` - Implementation task list with current status and progress

**Reference files (load as needed):**
- `PROJECT_STATUS.md` - Detailed project status (redundant with tasks.md)
- `CONTENT_ANALYSIS.md` - Working file with document analysis notes

## Core Requirements

### File Organization
- Store ALL Hugo-related files under the `/site` directory
- Avoid dot-prefixed directories/files except for standard ones (.git, .gitignore, etc.)
- Preserve existing markdown content without modification
- Exclude README.md from documentation processing

### Content Processing
- Read through all documents to extract titles (use titles, not filenames in navigation)
- Generate 2-3 sentence summaries for each document
- Create relevant keywords/tags for taxonomy
- Store summaries and keywords in front matter
- Assign each document to one of 4-5 main categories (see CONTENT_ANALYSIS.md)

### Site Navigation & Features
- Category-based navigation with collapsible sections
- Multiple browsing options: all documents, by category, by date, by tags
- Right-side table of contents when viewing documents
- Tag filtering with summaries visible in document lists
- Mermaid diagram rendering support

### Technical Implementation
- Use Hugo with Books theme (already configured)
- Manual regeneration approach (not automated)
- Hugo development server for testing: http://localhost:1313/musings/
- All property-based tests required (not optional)
- Use fast-check library for property testing with 100+ iterations

### User Experience Priorities
- Navigation by interest/topic, not file structure
- Document titles (not filenames) throughout interface
- Summaries visible in all document lists
- Easy content discovery through multiple filtering options
- Clear document structure visibility

## Current Status

**✅ COMPLETED:** Hugo setup, Books theme configuration, Mermaid support, test documents
**🔄 IN PROGRESS:** Content analysis and metadata extraction (Task 2)
**⏳ NEXT:** Implement document content analyzer and summary generation

## Development Environment

### Hugo Commands
```powershell
# Set Hugo path
$env:PATH = $env:PATH + ";C:\Users\$env:USERNAME\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe"

# Build site
cd site
hugo

# Start development server
hugo server --buildDrafts --bind 0.0.0.0 --port 1313
```

### Key Files
- `site/hugo.toml` - Hugo configuration (Books theme, Mermaid enabled)
- `site/content/docs/` - All documentation content
- `site/themes/book/` - Books theme installation

## Documentation Requirements
- Maintain historical prompt for reproducibility (HISTORICAL_PROMPT.md)
- Document all guidelines and constraints (this file)
- Provide clear setup instructions for future maintainers (PROJECT_STATUS.md)