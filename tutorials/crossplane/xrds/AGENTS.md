# Agent Guidance for XRD Tutorial Reorganization

## Overview

This document provides guidance for AI agents continuing the XRD tutorial specification reorganization work. The project is transforming scattered pedagogical and technical content into a unified specification following established methodology.

## Context Documents (READ THESE FIRST)

### Primary Methodology
- **`tutorial-spec-methodology.md`**: Core methodology for tutorial specification development
  - Defines 4-section structure: Learning Architecture → Content Design → Implementation Bridge → Technical Specification
  - Explains cognitive context grouping principles
  - Provides review guidelines and success criteria

### Execution Plan
- **`.kiro/specs/xrd-tutorial/reorganization-plan.md`**: Detailed 8-task transformation plan
  - Task-by-task breakdown with consistency properties
  - Source document hierarchy and content mapping
  - Risk mitigation and validation approach

## Current Project State

### Source Documents (DO NOT MODIFY)
- **`task_plan.md`**: Pedagogical authority - learning objectives, content design, progression rationale
- **`.kiro/specs/xrd-tutorial/requirements.md`**: Technical requirements and constraints
- **`.kiro/specs/xrd-tutorial/design.md`**: Technical architecture and implementation details
- **`.kiro/specs/xrd-tutorial/implementation_guidance.md`**: Gap analysis and detailed specifications

### Target Output
- **`.kiro/specs/xrd-tutorial/tutorial-specification.md`**: Unified specification (TO BE CREATED)

## Source Document Authority Hierarchy

1. **Pedagogical Decisions**: Use `task_plan.md` as source of truth
2. **Technical Specifications**: Use `design.md` and `requirements.md` as primary sources
3. **Advisory Details**: Use `implementation_guidance.md` only when not conflicting with above

## Task Execution Guidelines

### Before Starting Any Task
1. **Read the methodology**: Understand the 4-section structure and cognitive context principles
2. **Review the plan**: Understand which task you're executing and its consistency properties
3. **Check current state**: Verify which tasks have been completed by examining existing files

### During Task Execution
1. **Follow the plan exactly**: Each task has specific content sources and consistency properties
2. **Preserve all information**: No content should be lost from source documents
3. **Maintain traceability**: Document where content comes from in your work
4. **Check consistency properties**: Ensure the properties listed for your task are satisfied

### After Task Completion
1. **Validate consistency properties**: Confirm all properties for your task are met
2. **Test document readability**: Ensure the document flows logically and is understandable
3. **Check cross-references**: Verify all internal and external references work correctly

## Key Principles to Follow

### Content Organization
- **Section 1 (Learning Architecture)**: Pure pedagogical content - learning objectives, target audience, methodology
- **Section 2 (Content Design)**: Curriculum structure - topic selection, example rationale, scaffolding strategy
- **Section 3 (Implementation Bridge)**: Connect pedagogical decisions to technical choices with explicit rationale
- **Section 4 (Technical Specification)**: Pure technical content - APIs, configurations, validation requirements

### Cognitive Context Boundaries
- **Avoid rapid switching**: Keep pedagogical and technical content in appropriate sections
- **Maintain mental models**: Each section should be reviewable in its appropriate cognitive context
- **Provide clear transitions**: When sections reference each other, make the connection explicit

### Information Integrity
- **No information loss**: All content from source documents must be preserved
- **No unauthorized additions**: Only add explanatory content, summaries, or pedagogical rationale
- **Preserve references**: All cross-references, links, and navigation must be maintained

## Common Pitfalls to Avoid

### Content Mixing
- Don't put technical API details in Learning Architecture section
- Don't put pedagogical rationale in Technical Specification section
- Don't duplicate content across sections without clear purpose

### Information Handling
- Don't lose technical specifications when focusing on pedagogy
- Don't add new technical requirements not present in source documents
- Don't break existing cross-references or external links

### Process Issues
- Don't skip consistency property validation
- Don't proceed to next task if current task properties aren't met
- Don't modify source documents (they are reference materials)

## Validation Checklist

After completing any task, verify:
- [ ] All source content for this task has been incorporated
- [ ] No information has been lost from source documents
- [ ] Cross-references and links work correctly
- [ ] Document section flows logically and is readable
- [ ] Consistency properties for this task are satisfied
- [ ] No unauthorized technical requirements added
- [ ] Pedagogical and technical content properly separated by section

## Getting Help

If you encounter issues:
1. **Review the methodology**: Check if the 4-section structure addresses your concern
2. **Consult the plan**: Verify you're following the correct task steps and content sources
3. **Check source hierarchy**: Ensure you're using the right document as authority for your content type
4. **Validate against principles**: Confirm your approach aligns with cognitive context grouping

## Success Indicators

You're on track when:
- Each section can be reviewed in its appropriate cognitive context (pedagogical vs technical)
- All technical choices have clear pedagogical rationale in the Implementation Bridge section
- The document serves as a complete replacement for the original scattered specifications
- Future implementers can understand both WHAT to build and WHY it serves learning objectives

## Final Notes

This reorganization creates a new pattern for tutorial specification development that balances pedagogical soundness with technical precision. The unified document should demonstrate how learning objectives drive technical implementation choices while maintaining clear cognitive boundaries for efficient review.

Remember: The goal is not just to reorganize content, but to create a specification that produces better educational outcomes through integrated pedagogical and technical decision-making.