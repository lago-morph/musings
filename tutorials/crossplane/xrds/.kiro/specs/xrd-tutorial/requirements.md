# Requirements Document

## Introduction

This specification defines the requirements for creating a comprehensive 4-layer tutorial that teaches Crossplane v2.1 Composite Resources to Kubernetes/AWS/Terraform experts. The tutorial uses an ApiEndpoint and ApiRoute example system to demonstrate XRDs, Compositions, Managed Resources, status field mechanics, and Python Composition Functions. This is a toy system designed specifically for learning Crossplane architectural concepts, not for production use.

## Glossary

- **Tutorial_System**: The complete 4-layer educational content delivery system
- **ApiEndpoint_XRD**: Composite Resource Definition encapsulating API Gateway + Lambda + IAM
- **ApiRoute_XRD**: Composite Resource Definition encapsulating API Gateway routes with parent dependencies
- **Traditional_Patches**: Crossplane's built-in patch-and-transform composition approach
- **Composition_Function**: Custom Python function for advanced composition logic
- **Real_Metrics**: CloudWatch metrics that change independently of Crossplane infrastructure
- **Dependency_Resolution**: Crossplane v2 pattern where child resources wait for parent resource readiness
- **Status_Propagation**: Flow of status information from AWS resources through MRs to XRs
- **Target_Audience**: Experts in Kubernetes, AWS, and Terraform who are learning Crossplane concepts
- **ttl_sh_Registry**: Anonymous container registry with 24-hour availability
- **Diataxis_Framework**: Documentation framework distinguishing between tutorial (learning-oriented) and how-to guide (problem-solving oriented) content (https://diataxis.fr/)

## Requirements

### Requirement 1: Tutorial Structure and Content Organization

**User Story:** As a Crossplane learner, I want a structured 4-layer tutorial progression, so that I can understand concepts before diving into implementation details.

#### Acceptance Criteria

1. THE Tutorial_System SHALL provide exactly four distinct layers of content
2. WHEN a user accesses Layer 1, THE Tutorial_System SHALL present conceptual overview with diagrams and no code
3. WHEN a user accesses Layer 2, THE Tutorial_System SHALL present architectural deep-dive with minimal code snippets (5-15 lines maximum)
4. WHEN a user accesses Layer 3, THE Tutorial_System SHALL present complete implementation with heavily commented code-as-narrative
5. WHEN a user accesses Layer 4, THE Tutorial_System SHALL provide troubleshooting how-to guide format for direct problem-solving use
6. THE Tutorial_System SHALL organize content in directory structure compatible with future Hugo site integration
7. THE Tutorial_System SHALL use markdown format with embedded Mermaid diagrams throughout all layers
8. THE Tutorial_System SHALL follow the Diataxis_Framework distinction between tutorial (learning-oriented) and how-to guide (problem-solving oriented) formats

### Requirement 2: Crossplane v2.1 Technical Compliance

**User Story:** As a Crossplane learner, I want current v2.1 syntax and patterns, so that I learn modern approaches without obsoleted v1 patterns.

#### Acceptance Criteria

1. THE Tutorial_System SHALL use only Crossplane v2.1 API structures and syntax
2. THE Tutorial_System SHALL NOT include any Crossplane v1 patterns, especially Claims
3. WHEN Operations features are needed, THE Tutorial_System SHALL use Crossplane v2.1
4. WHEN Operations features are not needed, THE Tutorial_System SHALL use Crossplane v2.0 as acceptable
5. THE Tutorial_System SHALL use current upbound AWS provider APIs as of December 2025
6. THE Tutorial_System SHALL validate all YAML syntax for Crossplane v2.1 compatibility

### Requirement 3: ApiEndpoint XRD Implementation with Traditional Patches

**User Story:** As a learner, I want to see traditional patch-and-transform composition, so that I understand the simpler declarative approach.

#### Acceptance Criteria

1. THE ApiEndpoint_XRD SHALL encapsulate the AWS resources needed for a complete API endpoint
2. THE ApiEndpoint_XRD SHALL use traditional patches without Composition Functions
3. THE ApiEndpoint_XRD SHALL include spec fields for apiName, description, and lambdaRuntime
4. THE ApiEndpoint_XRD SHALL include status fields as specified in the design document Status Field Patterns section
5. WHEN status fields are populated, THE Tutorial_System SHALL use built-in status propagation from Managed Resources
6. THE Tutorial_System SHALL demonstrate ToCompositeFieldPath patches for status field population
7. THE Tutorial_System SHALL integrate real CloudWatch metrics as specified in Requirement 6

### Requirement 4: ApiRoute XRD Implementation with Python Composition Function

**User Story:** As a learner, I want to see custom composition function logic, so that I understand when and how to use functions versus traditional patches.

#### Acceptance Criteria

1. THE ApiRoute_XRD SHALL encapsulate the AWS resources needed for API Gateway routing
2. THE ApiRoute_XRD SHALL use Python Composition Function for custom logic
3. THE ApiRoute_XRD SHALL include spec fields for routePath, httpMethod, responseText, and apiEndpointRef
4. THE ApiRoute_XRD SHALL include status fields as specified in the design document Status Field Patterns section
5. WHEN status fields are populated, THE Composition_Function SHALL compute custom status aggregation
6. THE Composition_Function SHALL integrate real CloudWatch metrics as specified in Requirement 6
7. THE Composition_Function SHALL include basic error handling without retry logic
8. THE Tutorial_System SHALL use ttl_sh_Registry for anonymous 24-hour container availability

### Requirement 5: Dependency Resolution and Timing Demonstration

**User Story:** As a learner, I want to understand how Crossplane handles resource dependencies, so that I can design proper parent-child relationships.

#### Acceptance Criteria

1. THE ApiRoute_XRD SHALL reference parent ApiEndpoint_XRD using composite resource references
2. WHEN ApiRoute resources are created, THE Tutorial_System SHALL demonstrate dependency resolution timing
3. THE Tutorial_System SHALL show how ApiRoute waits for ApiEndpoint Lambda ARN availability
4. THE Tutorial_System SHALL explain Crossplane's built-in dependency management and reconciliation loops
5. THE Tutorial_System SHALL demonstrate proper composite resource reference patterns in Layer 2 architecture section
6. THE Tutorial_System SHALL include timing diagrams showing dependency resolution flow

### Requirement 6: Real CloudWatch Metrics Integration for Status Fields

**User Story:** As a learner, I want to see real AWS metrics in status fields, so that I understand how to integrate external data sources versus static configuration.

#### Acceptance Criteria

1. THE Tutorial_System SHALL integrate CloudWatch API calls for real metric retrieval in status fields
2. THE ApiEndpoint_XRD SHALL populate invocationCount and lastInvoked from Lambda CloudWatch metrics
3. THE ApiRoute_XRD SHALL populate requestCount and avgResponseTime from API Gateway CloudWatch metrics
4. WHEN CloudWatch API calls fail, THE Composition_Function SHALL report errors clearly in XR status, allow retry when root cause is fixed, and avoid leaving inconsistent state
5. THE Tutorial_System SHALL limit CloudWatch integration scope to learning Crossplane concepts, not CloudWatch expertise
6. THE Tutorial_System SHALL demonstrate both built-in status propagation and custom function-based status computation

### Requirement 7: Terraform Context for Complex Concepts

**User Story:** As a Crossplane learner with infrastructure expertise, I want complex concepts explained clearly with optional familiar context, so that I can leverage existing knowledge when concepts are difficult to grasp.

#### Acceptance Criteria

1. THE Tutorial_System SHALL provide clear, technology-neutral explanations for all Crossplane concepts
2. WHEN a concept is difficult to explain succinctly, THE Tutorial_System SHALL optionally include Terraform context as supplementary explanation
3. WHEN Terraform context is provided, THE Tutorial_System SHALL use format "For instance, when using Terraform you would do similar operations by..." followed by brief description
4. THE Tutorial_System SHALL NOT include Terraform code examples, only conceptual descriptions
5. THE Tutorial_System SHALL prioritize Crossplane-native explanations over external technology references
6. THE Tutorial_System SHALL note when Crossplane capabilities have no direct equivalent in other infrastructure tools

### Requirement 8: Performance Considerations and External References

**User Story:** As a Crossplane learner with infrastructure expertise, I want awareness of performance implications, so that I can make informed architectural decisions without digressing from core concepts.

#### Acceptance Criteria

1. WHEN performance implications exist between approaches, THE Tutorial_System SHALL provide brief mentions (1-3 sentences) with links to external Crossplane documentation
2. THE Tutorial_System SHALL NOT include detailed performance analysis that distracts from structural learning
3. THE Tutorial_System SHALL reference external Crossplane documentation for performance details
4. THE Tutorial_System SHALL note function overhead implications when comparing traditional patches versus Composition Functions
5. THE Tutorial_System SHALL maintain focus on Crossplane architectural understanding as primary objective

### Requirement 9: Troubleshooting Guide and Cross-References

**User Story:** As a practitioner, I want practical troubleshooting guidance, so that I can resolve common issues when following the tutorial or applying concepts.

#### Acceptance Criteria

1. THE Tutorial_System SHALL provide Layer 4 troubleshooting content in Diataxis_Framework how-to guide format
2. THE Tutorial_System SHALL include troubleshooting for MR stuck in "Creating" state with diagnosis and resolution steps
3. THE Tutorial_System SHALL include troubleshooting for function deployment failures covering container issues, registry problems, and function errors
4. THE Tutorial_System SHALL include troubleshooting for status field not updating covering status propagation and metric retrieval debugging
5. THE Tutorial_System SHALL include troubleshooting for dependency resolution issues when ApiRoute cannot find parent ApiEndpoint resources
6. THE Tutorial_System SHALL provide cross-references from other layers to relevant troubleshooting sections
7. THE Tutorial_System SHALL structure troubleshooting content for direct problem-solving use following Diataxis_Framework how-to guide format, not tutorial narrative

### Requirement 11: Security and Complexity Simplification

**User Story:** As a Crossplane learner, I want simplified examples that focus on core concepts, so that I can understand Crossplane architecture without being distracted by production security concerns.

#### Acceptance Criteria

1. THE Tutorial_System SHALL ignore RBAC and security concerns throughout all examples
2. THE Tutorial_System SHALL assume administrative privileges for all operations
3. THE Tutorial_System SHALL use simplified configurations optimized for learning rather than production
4. THE Tutorial_System SHALL explicitly note when simplifications are made for educational purposes
5. THE Tutorial_System SHALL focus on legal syntax while avoiding production-ready complexity

### Requirement 12: Educational Methodology and Content Format

**User Story:** As a Crossplane learner, I want a read-through tutorial format with specific content organization, so that I can learn concepts through narrative rather than hands-on exercises.

#### Acceptance Criteria

1. THE Tutorial_System SHALL provide read-through tutorial format, not hands-on exercises
2. WHEN Layer 3 content is presented, THE Tutorial_System SHALL use code as teaching narrative with extensive inline comments
3. THE Tutorial_System SHALL NOT use alternating blocks of text and code in Layer 3
4. THE Tutorial_System SHALL explain WHY and HOW in code comments, not just WHAT
5. THE Tutorial_System SHALL organize content for future Hugo site integration with minimal rework required
6. WHEN the tutorial is tested, THE Tutorial_System SHALL be validated by AWS/Kubernetes/Terraform experts learning Crossplane

**User Story:** As a Crossplane learner, I want complete, executable examples in Layer 3, so that I can optionally follow along with implementation to reinforce learning.

#### Acceptance Criteria

1. THE Tutorial_System SHALL provide complete YAML manifests for all XRDs, Compositions, and example instances in Layer 3
2. THE Tutorial_System SHALL provide complete Python Composition Function code with extensive inline comments in Layer 3
3. THE Tutorial_System SHALL include container build and deployment instructions using ttl_sh_Registry in Layer 3
4. THE Tutorial_System SHALL provide verification scripts for testing status fields and live API endpoints in Layer 3
5. THE Tutorial_System SHALL include cleanup instructions with proper resource deletion order in Layer 3
6. WHEN users follow Layer 3 examples, THE Tutorial_System SHALL produce working API Gateway endpoints with real Lambda responses
7. THE Tutorial_System SHALL validate all Layer 3 code examples for syntactic correctness and Crossplane v2.1 compatibility
8. WHEN Layers 1 and 2 reference implementation details, THE Tutorial_System SHALL refer to Layer 3 content without duplicating complete manifests

### Requirement 10: Layer 3 Complete Working Examples and Validation

**User Story:** As a Crossplane learner, I want complete, executable examples in Layer 3, so that I can optionally follow along with implementation to reinforce learning.

#### Acceptance Criteria

1. THE Tutorial_System SHALL provide complete YAML manifests for all XRDs, Compositions, and example instances in Layer 3
2. THE Tutorial_System SHALL provide complete Python Composition Function code with extensive inline comments in Layer 3
3. THE Tutorial_System SHALL include container build and deployment instructions using ttl_sh_Registry in Layer 3
4. THE Tutorial_System SHALL provide verification scripts for testing status fields and live API endpoints in Layer 3
5. THE Tutorial_System SHALL include cleanup instructions with proper resource deletion order in Layer 3
6. WHEN users follow Layer 3 examples, THE Tutorial_System SHALL produce working API Gateway endpoints with real Lambda responses
7. THE Tutorial_System SHALL validate all Layer 3 code examples for syntactic correctness and Crossplane v2.1 compatibility
8. WHEN Layers 1 and 2 reference implementation details, THE Tutorial_System SHALL refer to Layer 3 content without duplicating complete manifests