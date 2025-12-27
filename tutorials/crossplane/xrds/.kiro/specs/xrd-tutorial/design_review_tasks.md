# Design Review Tasks: XRD Tutorial Specification Cleanup

## Overview

This task list breaks down the comprehensive specification cleanup into manageable, atomic changes that maintain document consistency and readability at each step. Each task ensures no information is lost and all cross-references remain valid.

## Tasks

- [x] 1. Add Diataxis Framework Foundation
- [x] 1.1 Add Diataxis_Framework to glossary in requirements.md
  - Add definition: "Documentation framework distinguishing between tutorial (learning-oriented) and how-to guide (problem-solving oriented) content"
  - Add reference URL: https://diataxis.fr/
  - _Requirements: 1.5, 9.7_

- [x] 1.2 Update Requirement 1 to reference Diataxis framework
  - Add acceptance criteria: "THE Tutorial_System SHALL follow the Diataxis framework distinction between tutorial (learning-oriented) and how-to guide (problem-solving oriented) formats"
  - _Requirements: 1.5_

- [x] 1.3 Update Requirement 9 to reference Diataxis framework
  - Add reference to https://diataxis.fr/ for how-to guide format definition
  - Update acceptance criteria 9.1 and 9.7 to explicitly mention Diataxis how-to guide format
  - _Requirements: 9.1, 9.7_

- [x] 2. Clarify Vague Requirements Language
- [x] 2.1 Clarify error handling in Requirement 6.4
  - Change from: "WHEN CloudWatch API calls fail, THE Composition_Function SHALL handle errors gracefully without failing composition"
  - To: "WHEN CloudWatch API calls fail, THE Composition_Function SHALL report errors clearly in XR status, allow retry when root cause is fixed, and avoid leaving inconsistent state"
  - _Requirements: 6.4_

- [x] 2.2 Clarify performance mentions in Requirement 8.1
  - Change from: "brief mentions with links"
  - To: "brief mentions (1-3 sentences) with links to external Crossplane documentation"
  - _Requirements: 8.1_

- [x] 3. Remove AWS Resource Implementation Details from Requirements
- [x] 3.1 Generalize AWS resource references in Requirement 3.1
  - Change from: "THE ApiEndpoint_XRD SHALL encapsulate API Gateway REST API, Lambda function, and IAM role resources"
  - To: "THE ApiEndpoint_XRD SHALL encapsulate the AWS resources needed for a complete API endpoint"
  - _Requirements: 3.1_

- [x] 3.2 Generalize AWS resource references in Requirement 4.1
  - Change from: "THE ApiRoute_XRD SHALL encapsulate API Gateway Method/Route and Integration resources"
  - To: "THE ApiRoute_XRD SHALL encapsulate the AWS resources needed for API Gateway routing"
  - _Requirements: 4.1_

- [x] 4. Consolidate CloudWatch Requirements
- [x] 4.1 Create new consolidated CloudWatch requirement
  - Merge content from Requirements 3.7, 4.6, and all of Requirement 6
  - Create new "Requirement 6: Real CloudWatch Metrics Integration for Status Fields"
  - Focus on WHAT (integrate real metrics) not HOW (specific namespaces/dimensions)
  - _Requirements: 3.7, 4.6, 6.1-6.6_

- [x] 4.2 Remove redundant CloudWatch references from Requirements 3 and 4
  - Remove acceptance criteria 3.7 from Requirement 3
  - Remove acceptance criteria 4.6 from Requirement 4
  - Add cross-reference to consolidated Requirement 6
  - _Requirements: 3.7, 4.6_

- [x] 5. Add Missing Design Sections for Requirements 11 & 12
- [x] 5.1 Add Educational Methodology section to design.md Architecture
  - Explain read-through tutorial format (not hands-on exercises)
  - Explain code-as-narrative approach for Layer 3
  - Explain learning-oriented vs problem-solving oriented content per Diataxis
  - Reference Requirements 12.1, 12.2, 12.3
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 5.2 Add Security Simplification Strategy section to design.md Architecture
  - Explain ignore RBAC and security concerns assumption
  - Explain administrative privileges assumption
  - Explain educational simplifications with explicit notation approach
  - Reference Requirements 11.1, 11.2, 11.4
  - _Requirements: 11.1, 11.2, 11.4_

- [x] 6. Move Over-Detailed Content to Implementation Guidance
- [x] 6.1 Move CloudWatch specifications from design.md to implementation_guidance.md
  - Move specific metrics, namespaces, dimensions, time ranges from "Components and Interfaces" section
  - Keep high-level CloudWatch integration strategy in design
  - Add reference in design to implementation_guidance.md for specifics
  - Update implementation_guidance.md with moved content
  - _Design: CloudWatch Integration Specifications_

- [x] 6.2 Move container registry details from design.md to implementation_guidance.md
  - Move specific naming conventions (ttl.sh/crossplane-apiroute-function:24h format)
  - Keep high-level container strategy in design
  - Add reference in design to implementation_guidance.md for specifics
  - Update implementation_guidance.md with moved content
  - _Design: Container Registry Strategy_

- [x] 7. Create Status Field Teaching Pattern
- [x] 7.1 Create dedicated "Status Field Patterns" section in design.md
  - Explain how status propagation works from AWS → MR → XR
  - Explain difference between built-in propagation (ApiEndpoint) vs custom computation (ApiRoute)
  - Explain educational value of each status field type
  - _Requirements: 3.4, 4.4, 6.2, 6.3_

- [x] 7.2 Update XRD sections to reference Status Field Patterns
  - Remove detailed field lists from ApiEndpoint and ApiRoute XRD sections
  - Add cross-reference to Status Field Patterns section
  - Maintain field names for schema definitions but remove detailed explanations
  - _Design: Data Models section_

- [x] 7.3 Update requirements to reference design for status field details
  - Update Requirements 3.4 and 4.4 to reference design document for detailed status field specifications
  - Remove redundant status field lists from requirements
  - _Requirements: 3.4, 4.4_

- [x] 8. Consolidate Properties from 14 to 6
- [x] 8.1 Replace Properties 1, 9, 10, 14 with consolidated "Tutorial Content Structure Validation"
  - Combine layer format constraints, troubleshooting completeness, implementation completeness, educational methodology
  - Update property description and validation references
  - _Design: Correctness Properties section_

- [x] 8.2 Replace Properties 2, 3, 4, 12 with consolidated "Crossplane Technical Compliance"
  - Combine v2.1 compliance, XRD schema completeness, composition approach validation, resource creation validation
  - Update property description and validation references
  - _Design: Correctness Properties section_

- [x] 8.3 Replace Properties 6, 11 with consolidated "External Integration Validation"
  - Combine CloudWatch integration and container registry configuration
  - Update property description and validation references
  - _Design: Correctness Properties section_

- [x] 8.4 Replace Properties 7, 8 with consolidated "Content Format and Reference Compliance"
  - Combine Terraform context format and performance reference validation
  - Update property description and validation references
  - _Design: Correctness Properties section_

- [x] 8.5 Keep Property 13 as "Educational Constraint Compliance"
  - Maintain security simplification compliance as standalone property
  - Update validation references if needed
  - _Design: Correctness Properties section_

- [x] 8.6 Keep Property 5 as "Dependency and Error Handling Validation"
  - Maintain dependency resolution implementation as standalone property
  - Update validation references if needed
  - _Design: Correctness Properties section_

- [x] 9. Update Testing Strategy Section
- [x] 9.1 Add comprehensive testing strategy explanation to design.md
  - Explain why property-based testing is needed for a tutorial system
  - Reference the 6 consolidated properties
  - Maintain dual testing approach (unit + property-based)
  - _Design: Testing Strategy section_

- [x] 9.2 Update property-based test configurations
  - Update test tags to reference consolidated properties 1-6
  - Ensure minimum 100 iterations per test requirement is maintained
  - _Design: Testing Strategy section_

- [x] 10. Eliminate Redundant Design Sections
- [x] 10.1 Merge "Components and Interfaces" with "Data Models"
  - Create single "System Components" section
  - Add subsections: "XRD Specifications", "Composition Strategies", "Integration Patterns"
  - Use cross-references instead of repeating information
  - _Design: Components and Data Models sections_

- [x] 10.2 Add executive summaries to major design sections
  - Add brief overview at top of Architecture, System Components, and Testing Strategy sections
  - Improve navigation between related concepts
  - _Design: All major sections_

- [x] 11. Final Consistency Check
- [x] 11.1 Validate all cross-references between documents
  - Check requirements → design references
  - Check design → implementation_guidance references
  - Check internal document references
  - _All documents_

- [x] 11.2 Verify no information loss during consolidation
  - Compare original requirements coverage with consolidated version
  - Compare original design coverage with updated version
  - Ensure all acceptance criteria are still addressed
  - _All documents_

## Notes

- Each task maintains document consistency and readability
- Cross-references are updated immediately when content is moved
- No information is lost during consolidation steps
- Tasks can be interrupted and resumed without breaking document integrity
- Implementation guidance serves as the bridge for technical details moved from design