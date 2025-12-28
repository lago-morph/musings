# Tutorial Workflow Modifications

## Core Principle
**Learning objectives drive technical choices** - not vice versa. When conflicts arise, prioritize pedagogical soundness over technical convenience.

## File Structure Change
Tutorial specs use `tutorial-specification.md` instead of separate `requirements.md` and `design.md`.

## 4-Section Structure
**Section 1: Learning Architecture** (Educational designer mindset)
- Target learner profile, learning objectives, pedagogical approach, content progression strategy

**Section 2: Content Design** (Curriculum developer mindset)  
- Topic selection/scope, example system rationale, content organization, scaffolding strategy

**Section 3: Implementation Bridge** (Educational technologist mindset)
- Pedagogical-technical mappings, constraint analysis, trade-off decisions, quality criteria

**Section 4: Technical Specification** (Technical architect mindset)
- API versions, resource specifications, integration details, code structure, validation requirements

## Modified 6-Phase Workflow

**Phase 1 (Requirements Equivalent): Learning Foundation**
- Scope: Complete Sections 1-2 of tutorial-specification.md
- Review: Educational effectiveness, learner needs alignment
- Approval: Use `userInput` tool with reason 'spec-requirements-review'

**Phase 2 (Design Equivalent): Technical Implementation**  
- Scope: Complete Sections 3-4 of tutorial-specification.md
- Review: Technical feasibility, pedagogical-technical alignment
- Approval: Use `userInput` tool with reason 'spec-design-review'

**Phase 3 (Technical Validation): Proof-of-Concept**
- Scope: Validate core technical assumptions before major content investment
- Deliverables: Working proof-of-concept, prerequisite infrastructure, verification scripts
- Purpose: Mitigate implementation risks through early validation

**Phase 4 (Tasks): Standard Implementation Planning**
- Scope: Create tasks.md based on complete tutorial-specification.md and validated technical foundation
- Approval: Use `userInput` tool with reason 'spec-tasks-review'

**Phase 5 (Implementation): Full Tutorial Development**
- Scope: Execute tasks using tutorial-specification.md and proof-of-concept as reference

**Phase 6 (Final Validation): Comprehensive Testing**
- Scope: Complete tutorial validation and educational effectiveness assessment

## Key AI Agent Behaviors

**Cognitive Context Grouping**: Organize content to minimize mental context switching during review - group pedagogical concerns together, technical concerns together.

**Pedagogical-Technical Integration**: Always document rationale connecting learning objectives to technical implementation choices.

**Educational Validation**: Success criteria must include both technical accuracy AND learning effectiveness.

**Phase 3 Focus**: AI agent creates infrastructure configuration, determines tutorial content vs. prerequisites, provides clear verification scripts.

## Quality Validation Requirements
- All technical choices must serve clear pedagogical purposes
- Content must maintain appropriate cognitive context boundaries  
- Implementation must produce effective educational outcomes for target audience
- Learning objectives must be achievable with technical specifications

## Additional Resources (Targeted References)
**When encountering challenges, reference specific sections:**

- **Common Pitfalls**: See `.kiro/reference/tutorial-spec-methodology.md` lines 140-159
  - Pedagogical, technical, and process pitfalls to avoid
- **Success Indicators**: See `.kiro/reference/tutorial-spec-methodology.md` lines 160-179  
  - Educational, technical, and process success criteria
- **Adaptation Guidelines**: See `.kiro/reference/tutorial-spec-methodology.md` lines 180-198
  - Adapting methodology for hands-on, reference, or conceptual tutorials
- **Exercise Integration**: See `.kiro/reference/tutorial-spec-methodology.md` lines 199-250
  - Optional exercise types and integration principles