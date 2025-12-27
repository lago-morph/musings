# Document 1: Task Summary & User Preferences

## Task Overview
Create a comprehensive 4-layer tutorial teaching Crossplane v2.1 Composite Resources to Kubernetes/AWS/Terraform experts. The tutorial uses an **ApiEndpoint and ApiRoute** example to demonstrate XRDs, Compositions, Managed Resources, status field mechanics, and Python Composition Functions.

**CRITICAL**: This is a **toy system for learning Crossplane concepts only** - not intended for production use. The expert audience understands the simplifications and won't emulate them in real situations.

## Example Scenario Details

### ApiEndpoint XRD
- **Encapsulates**: API Gateway REST API + Lambda function + IAM role
- **Status fields**: Real AWS metrics that change independently (e.g., invocation count from CloudWatch, endpoint health)
- **Approach**: Use **traditional patches** (no Composition Function)
- **Status mechanism**: Built-in status propagation from Managed Resources
- **Metrics requirement**: Must query actual AWS state, not static values

### ApiRoute XRD
- **Encapsulates**: API Gateway Method/Route + Integration to parent Lambda
- **Status fields**: Real metrics (e.g., request count, response times from API Gateway)
- **Parent dependency**: Uses composite resource refs (Crossplane v2 native pattern)
- **Approach**: Use **Python Composition Function** for logic (minimal scope - just enough to demonstrate the pattern)
- **Status mechanism**: Custom Composition Function to aggregate/compute status
- **Dependency timing**: Demonstrates common Crossplane pattern where ApiRoute waits for ApiEndpoint Lambda ARN

### Lambda Function
- Minimal "hello world" implementation
- Each route returns different simple text output
- Complete but not complex

## Target Audience
- **Expertise**: Kubernetes experts, AWS experts, Terraform power users
- **Knowledge level**: Understands infrastructure as code, familiar with K8s CRDs
- **Learning gap**: How to apply Crossplane, specifically composition patterns and custom logic
- **Assumption**: Expert enough to understand simplifications and not copy-paste to production

## User Preferences

### Tutorial Structure (4 Layers)
1. **Layer 1 - High-Level Overview**
   - No YAML or code
   - Heavy use of diagrams and visuals
   - Workflow overview from start to finish
   - Conceptual understanding

2. **Layer 2 - Architecture Deep-Dive**
   - Architectural explanations of each component
   - Small configuration snippets only (5-10 lines max)
   - More diagrams showing relationships
   - Focus on "how it works" not "here's the code"

3. **Layer 3 - Complete Implementation**
   - Full YAML manifests
   - Full Python code
   - **Heavily commented inline** (code as teaching narrative)
   - No alternating blocks of text and code
   - Comments explain WHY and HOW, not just WHAT

4. **Layer 4 - Troubleshooting Guide**
   - How-to guide format (not tutorial)
   - Common failure modes and debugging techniques
   - Cross-referenced from other layers where problems might occur
   - Directly usable for troubleshooting real issues

### Content Preferences
- **Diagrams**: Extensive use throughout all layers
- **Code comments**: Prefer inline comments over separate explanatory text
- **Scope discipline**: Do exactly what's asked, no extra "helpful" additions
- **Simplicity**: Legal syntax but simplified for learning (not production-ready)
- **Security**: Ignore RBAC and security concerns (assume admin everywhere)
- **Language**: Python for all custom code examples

### Technical Preferences
- **Crossplane version**: v2.1 (CRITICAL: NO v1 patterns - especially Claims are obsoleted)
- **Operations**: Use v2.1 if Operations are needed, otherwise v2 is acceptable
- **Status fields**: Show BOTH approaches (built-in vs custom function) with REAL metrics
- **Real metrics**: CloudWatch integration (minimal scope - for learning Crossplane, not CloudWatch)
- **Composition Functions**: Show BOTH approaches (traditional patches vs Python function)
- **Implementation split**: 
  - ApiEndpoint uses traditional patches + built-in status
  - ApiRoute uses Python function + custom status aggregation
- **Dependency pattern**: Use composite resource refs (Crossplane v2 native, very common pattern)
- **Dependency timing**: Demonstrate how ApiRoute waits for ApiEndpoint Lambda ARN
- **AWS resources**: Use upbound provider APIs current as of Dec 2025
- **Container registry**: Use ttl.sh (anonymous, 24-hour availability, no setup required)
- **Performance**: Brief mentions with links to Crossplane docs - don't digress from core concepts
- **Terraform mappings**: Use where helpful for concept explanation, not as primary goal

### Pedagogical Approach
- Read-through tutorial (not hands-on exercises)
- Explain concepts through Terraform mental models where applicable
- Focus on areas where custom code is needed (user's knowledge gap)
- Emphasize status field mechanics (another knowledge gap area)
- Show complete working examples that can be understood without typing

## Key Learning Objectives
1. Understand XRD structure (spec and status schema design)
2. Understand Composition role (implementation of XRD)
3. Master status field propagation (from AWS → MR → XR) with real metrics
4. Know when/how to use Composition Functions vs traditional patches
5. Understand composite resource references and dependency timing (common v2 pattern)
6. See complete working examples of both approaches
7. Learn troubleshooting techniques for common Crossplane issues
8. Brief performance considerations (when to choose each approach)
9. Understand Terraform mental model mappings for faster learning

## Deliverables Format
- Tutorial structured in 4 distinct layers
- Heavy inline commenting in all code (Layer 3)
- Multiple diagrams throughout (all layers)
- Complete, executable manifests and code (valid Crossplane v2.1 syntax)
- Comparison of traditional vs function-based approaches
- Cross-referenced troubleshooting guide
- Working examples that could be followed along (though not the primary intent)

## Critical Design Decisions from Discussion

### Dependency Timing Pattern
- **Decision**: Include ApiRoute → ApiEndpoint dependency (common Crossplane v2 pattern)
- **Rationale**: Essential for teaching dependency resolution and status propagation
- **Implementation**: ApiRoute waits for ApiEndpoint Lambda ARN via composite resource refs
- **Educational value**: Shows real-world composition patterns and Crossplane's built-in dependency management

### Status Field Requirements
- **Must be real AWS metrics** that change independently of Crossplane infrastructure
- **Examples**: CloudWatch invocation counts, API Gateway request metrics, response times
- **Purpose**: Demonstrate actual status querying vs static configuration
- **Implementation**: Both built-in propagation (ApiEndpoint) and custom aggregation (ApiRoute)
- **Scope**: Minimal CloudWatch integration - for learning Crossplane structure, not CloudWatch expertise

### Composition Function Scope
- **Minimal logic** - just enough to demonstrate the pattern
- **Focus**: Show structure of XRDs and Compositions, not production utility
- **Purpose**: Teach when/why to use functions vs traditional patches
- **Error handling**: Basic error handling, no retry logic
- **Dependencies**: Demonstrate dependency resolution timing (ApiRoute waits for ApiEndpoint)

### Version Compliance
- **Crossplane v2.1 syntax only** - absolutely no v1 patterns
- **Key obsoleted patterns**: Claims (completely replaced in v2)
- **Provider APIs**: Current upbound provider versions as of Dec 2025
- **Operations**: Use v2.1 if needed, otherwise v2 acceptable

### Troubleshooting Requirements
Layer 4 must include how-to guidance for these common scenarios:
1. **MR stuck in "Creating" state** - diagnosis and resolution steps
2. **Function deployment failures** - container issues, registry problems, function errors
3. **Status field not updating** - debugging status propagation and metric retrieval
4. **Dependency resolution issues** - when ApiRoute can't find parent ApiEndpoint resources

### Container Registry Strategy
- **Use ttl.sh** for anonymous, 24-hour container availability
- **No registry setup required** - keeps tutorial focused on Crossplane concepts
- **Rationale**: Avoids digressing into container registry management

### Performance and Scope Guidelines
- **Performance mentions**: Brief with links to Crossplane docs for details
- **Terraform mappings**: Use where helpful for explanation, not as primary learning goal
- **Hugo compatibility**: Keep in mind for future integration, minimize later rework
- **Audience testing**: Will be tested by AWS/K8s/Terraform expert learning Crossplane
- **Templating consideration**: Choose approaches that make later adaptation to different subjects easier
