# Agent Guidelines for Hugo Documentation Site Project

## Project Overview

This project creates a Hugo static site using the Books theme to present technology documentation with enhanced navigation and content discovery features.

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
- Assign each document to one of 4-5 main categories

### Site Navigation & Features
- Category-based navigation with collapsible sections
- Multiple browsing options: all documents, by category, by date, by tags
- Right-side table of contents when viewing documents
- Tag filtering with summaries visible in document lists
- Mermaid diagram rendering support

### Technical Implementation
- Use Hugo with Books theme
- Deploy to GitHub Pages
- Create GitHub Action for automatic deployment on push
- Ensure responsive design and user-friendly interface

### User Experience Priorities
- Navigation by interest/topic, not file structure
- Document titles (not filenames) throughout interface
- Summaries visible in all document lists
- Easy content discovery through multiple filtering options
- Clear document structure visibility

## Deployment Requirements
- GitHub Pages hosting
- Automated deployment via GitHub Actions
- Site accessible and functional after each push

## Documentation Requirements
- Maintain historical prompt for reproducibility
- Document all guidelines and constraints
- Provide clear setup instructions for future maintainers