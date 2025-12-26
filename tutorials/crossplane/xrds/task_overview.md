# Document 1: Task Summary & User Preferences

## Task Overview
Create a comprehensive 3-layer tutorial teaching Crossplane v2.1 Composite Resources to Kubernetes/AWS/Terraform experts. The tutorial uses an **ApiEndpoint and ApiRoute** example to demonstrate XRDs, Compositions, Managed Resources, status field mechanics, and Python Composition Functions.

## Example Scenario Details

### ApiEndpoint XRD
- **Encapsulates**: API Gateway REST API + Lambda function + IAM role
- **Status fields**: Live endpoint URL, deployment timestamp, invocation stats
- **Approach**: Use **traditional patches** (no Composition Function)
- **Status mechanism**: Built-in status propagation from Managed Resources

### ApiRoute XRD
- **Encapsulates**: API Gateway Method/Route + Integration to parent Lambda
- **Status fields**: Route health, request count, last modified
- **Parent dependency**: Uses composite resource refs (Crossplane-native)
- **Approach**: Use **Python Composition Function** for logic
- **Status mechanism**: Custom Composition Function to aggregate/compute status

### Lambda Function
- Minimal "hello world" implementation
- Each route returns different simple text output
- Complete but not complex

## Target Audience
- **Expertise**: Kubernetes experts, AWS experts, Terraform power users
- **Knowledge level**: Understands infrastructure as code, familiar with K8s CRDs
- **Learning gap**: How to apply Crossplane, specifically composition patterns and custom logic

## User Preferences

### Tutorial Structure (3 Layers)
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

### Content Preferences
- **Diagrams**: Extensive use throughout all layers
- **Code comments**: Prefer inline comments over separate explanatory text
- **Scope discipline**: Do exactly what's asked, no extra "helpful" additions
- **Simplicity**: Legal syntax but simplified for learning (not production-ready)
- **Security**: Ignore RBAC and security concerns (assume admin everywhere)
- **Language**: Python for all custom code examples

### Technical Preferences
- **Crossplane version**: v2.1 (current as of December 2025)
- **Status fields**: Show BOTH approaches (built-in vs custom function)
- **Composition Functions**: Show BOTH approaches (traditional patches vs Python function)
- **Implementation split**: 
  - ApiEndpoint uses traditional patches + built-in status
  - ApiRoute uses Python function + custom status aggregation
- **Dependency pattern**: Use composite resource refs (not names or labels)
- **AWS resources**: Use upbound provider APIs current as of Dec 2025

### Pedagogical Approach
- Read-through tutorial (not hands-on exercises)
- Explain concepts through Terraform mental models where applicable
- Focus on areas where custom code is needed (user's knowledge gap)
- Emphasize status field mechanics (another knowledge gap area)
- Show complete working examples that can be understood without typing

## Key Learning Objectives
1. Understand XRD structure (spec and status schema design)
2. Understand Composition role (implementation of XRD)
3. Master status field propagation (from AWS → MR → XR)
4. Know when/how to use Composition Functions vs traditional patches
5. Understand composite resource references (XRD dependencies)
6. See complete working examples of both approaches

## Deliverables Format
- Tutorial structured in 3 distinct layers
- Heavy inline commenting in all code (Layer 3)
- Multiple diagrams throughout (all layers)
- Complete, executable manifests and code
- Comparison of traditional vs function-based approaches
