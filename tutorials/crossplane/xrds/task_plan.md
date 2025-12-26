# Document 2: Detailed Action Plan

Additonal requirement:
- delivery format is markdown documents with embedded mermaid diagrams.
- Organize content in easy to understand and navigate (for a human) directory structure
- Keep in mind this will be made available via a Hugo site in the future.  While that is not in scope for this step, make sure choices about directory structure, file names, and content are made with the understanding that Hugo will be used in the future and we wish to minimize rework when we integrate the content of the tutorial into the Hugo site.

## Phase 1: Foundation & Research

### Step 1.1: Validate Technical Specifications
- Confirm Crossplane v2.1 API structure for XRDs
- Verify upbound AWS provider v1.x MR schemas for:
  - `lambda.aws.upbound.io/v1beta1/Function`
  - `apigatewayv2.aws.upbound.io/v1beta1/API`
  - `apigatewayv2.aws.upbound.io/v1beta1/Route`
  - `apigatewayv2.aws.upbound.io/v1beta1/Integration`
  - `iam.aws.upbound.io/v1beta1/Role`
- Confirm Composition Function framework (function-patch-and-transform vs custom)
- Verify status field propagation mechanisms in v2.1

### Step 1.2: Define Complete Resource Schemas
**ApiEndpoint XRD Schema:**
```
spec:
  - apiName (string)
  - description (string)
  - lambdaRuntime (string, default: python3.11)
  
status:
  - endpointUrl (string) - from API Gateway
  - deploymentTime (string) - from API resource
  - lambdaArn (string) - from Lambda MR
```

**ApiRoute XRD Schema:**
```
spec:
  - routePath (string)
  - httpMethod (string)
  - responseText (string)
  - apiEndpointRef (composite resource reference)
  
status:
  - routeStatus (string) - computed by function
  - createdAt (string) - computed by function
  - integrationId (string) - from Integration MR
```

### Step 1.3: Map AWS Resources to Managed Resources
**ApiEndpoint creates:**
1. IAM Role (for Lambda execution)
2. Lambda Function (with inline Python code)
3. API Gateway API (HTTP API or REST API)
4. Lambda Permission (for API Gateway to invoke)

**ApiRoute creates:**
1. API Gateway Route (linked to parent API)
2. API Gateway Integration (linking route to parent Lambda)

### Step 1.4: Design Lambda Function Logic
```python
# Minimal handler that returns different text per route
def handler(event, context):
    path = event.get('rawPath', '/')
    return {
        'statusCode': 200,
        'body': f'Hello from {path}'
    }
```

## Phase 2: Layer 1 Content Development

### Step 2.1: Introduction Section
**Content:**
- 2-3 paragraphs introducing the tutorial
- Explain why ApiEndpoint/ApiRoute is a good learning example
- Map Crossplane concepts to Terraform equivalents:
  - Module → Composition
  - Variable → XRD spec
  - Output → XRD status/connectionDetails

**Deliverables:**
- Introduction text
- No diagrams yet

### Step 2.2: The Big Picture Diagram
**Create diagram showing:**
- User (kubectl apply)
- ApiEndpoint XRD → Composition → Lambda MR + API Gateway MR + IAM MR → AWS resources
- ApiRoute XRD → Composition (with Python Function) → Route MR + Integration MR → AWS resources
- Status flow arrows going backwards
- Color coding: XRDs (blue), Compositions (green), MRs (orange), AWS (yellow)

**Annotations on diagram:**
- "Traditional patches used here" (ApiEndpoint)
- "Python function used here" (ApiRoute)
- "Status from MRs" vs "Status from function"

**Deliverables:**
- 1 comprehensive system architecture diagram

### Step 2.3: Step-by-Step Workflow Section
**Content (numbered list with mini-diagrams):**

1. **Install Crossplane + AWS Provider**
   - Mini-diagram: Crossplane control plane in K8s cluster
   
2. **Create ApiEndpoint XRD**
   - Mini-diagram: XRD defining the API schema
   
3. **Create ApiEndpoint Composition (Traditional Patches)**
   - Mini-diagram: Composition creating multiple MRs
   
4. **Create ApiRoute XRD**
   - Mini-diagram: XRD with parent reference
   
5. **Deploy Python Composition Function**
   - Mini-diagram: Function pod running in cluster
   
6. **Create ApiRoute Composition (Using Function)**
   - Mini-diagram: Composition pipeline with function step
   
7. **Apply ApiEndpoint Instance**
   - Mini-diagram: XR created, MRs provisioned
   
8. **Apply ApiRoute Instances**
   - Mini-diagram: Routes linking to parent, resources created
   
9. **Observe Status Fields**
   - Mini-diagram: Status propagation paths highlighted

**Deliverables:**
- Numbered workflow narrative
- 9 mini-diagrams (simple, focused)

### Step 2.4: Key Concepts Preview Section
**Content:**
- Where custom code is needed (ApiRoute composition function)
- Where it's NOT needed (ApiEndpoint traditional patches)
- Status fields: built-in propagation vs custom computation
- When to choose each approach

**Deliverables:**
- Conceptual explanation text
- Comparison table diagram

## Phase 3: Layer 2 Content Development

### Step 3.1: ApiEndpoint XRD Architecture
**Content:**
- Schema design explanation
- Spec fields purpose and validation
- Status fields and where they come from
- Small snippet (5-10 lines) showing field structure only

**Diagram:**
- ApiEndpoint XRD schema visual
- Arrows showing: spec → composition → MR spec
- Arrows showing: AWS resource → MR status → XR status

**Deliverables:**
- Architecture explanation text
- 1 schema diagram
- 1 tiny YAML snippet (structure only)

### Step 3.2: ApiEndpoint Composition Architecture
**Content:**
- Traditional patch-and-transform explanation
- Resources created and their relationships
- Patch types used (FromCompositeFieldPath, ToCompositeFieldPath)
- How status propagates without custom code

**Diagram:**
- Resource dependency graph (IAM → Lambda → API Gateway)
- Patch flow diagram (which fields patch where)

**Code snippet:**
- 10 lines showing ONE resource with ONE patch example

**Deliverables:**
- Architecture explanation text
- 2 diagrams
- 1 small snippet

### Step 3.3: ApiRoute XRD Architecture
**Content:**
- Schema design with parent reference
- Composite resource ref pattern explained
- How ApiRoute finds its parent ApiEndpoint
- Why status needs custom computation here

**Diagram:**
- ApiRoute XRD schema visual
- Parent-child reference diagram
- Status computation flow (function-based)

**Code snippet:**
- 5-8 lines showing resourceRef structure

**Deliverables:**
- Architecture explanation text
- 2 diagrams
- 1 small snippet

### Step 3.4: ApiRoute Composition Architecture (Function-Based)
**Content:**
- Why a function is used here (custom logic needed)
- What the function does (aggregate status, compute values)
- Resources created (Route + Integration)
- How function fits in composition pipeline

**Diagram:**
- Composition pipeline: Input → Function → Patch → Output
- Resource creation flow (Route + Integration)
- Function inputs/outputs

**Code snippet:**
- 10 lines showing function reference in composition

**Deliverables:**
- Architecture explanation text
- 2 diagrams
- 1 small snippet

### Step 3.5: Status Field Mechanics - Built-in Propagation
**Content:**
- How Crossplane automatically propagates status from MRs to XR
- ConnectionDetails mechanism
- ToCompositeFieldPath for status
- When this approach is sufficient

**Diagram:**
- Status flow: AWS API → MR status.atProvider → XR status (via patches)
- Timeline showing async propagation

**Deliverables:**
- Explanation text
- 1 detailed diagram

### Step 3.6: Status Field Mechanics - Custom Function
**Content:**
- When built-in propagation isn't enough
- How functions can compute/aggregate status
- Access to MR statuses within function
- Custom status field population

**Diagram:**
- Function reading multiple MR statuses
- Function computing new status fields
- Function writing to XR status

**Deliverables:**
- Explanation text
- 1 detailed diagram

### Step 3.7: Python Composition Function Deep-Dive
**Content:**
- Function framework overview (crossplane/function-sdk-python)
- Input: desired + observed state
- Output: desired state + status updates
- Deployment model (container in cluster)

**Diagram:**
- Function I/O diagram
- Function deployment architecture

**Code snippet:**
- 15 lines showing function structure (imports, handler signature)

**Deliverables:**
- Explanation text
- 2 diagrams
- 1 snippet

### Step 3.8: Comparison - When to Use Each Approach
**Content:**
- Traditional patches: simple, declarative, no custom code
- Functions: complex logic, custom status, transformations
- Decision tree for choosing approach

**Diagram:**
- Decision tree flowchart
- Side-by-side comparison table

**Deliverables:**
- Comparison text
- 2 diagrams

## Phase 4: Layer 3 Content Development

### Step 4.1: Prerequisites & Setup
**Content:**
- Complete installation commands (with inline comments)
- Crossplane installation via Helm
- AWS Provider installation
- ProviderConfig with admin credentials

**Code artifacts:**
```bash
# Install Crossplane
helm repo add crossplane-stable ...
# (each command commented)

# Install AWS Provider
kubectl apply -f - <<EOF
# Provider manifest with comments
EOF

# Create ProviderConfig
kubectl apply -f - <<EOF
# ProviderConfig with admin credentials
# Comments explain each field
EOF
```

**Deliverables:**
- Complete setup script with heavy inline comments

### Step 4.2: ApiEndpoint XRD - Complete YAML
**Content structure:**
```yaml
---
# ApiEndpoint XRD Definition
# This XRD defines the schema for our API Gateway + Lambda composite resource
# It uses TRADITIONAL PATCHES (no composition function) to show the simpler approach
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: apiendpoints.example.com
  # Name must be plural.group format
  
spec:
  # Group defines the API group for this XRD
  group: example.com
  
  names:
    # Kind is the type name users will use (singular, PascalCase)
    kind: ApiEndpoint
    # Plural is used in API URLs (lowercase)
    plural: apiendpoints
    
  # ClaimNames defines the namespace-scoped variant (optional)
  claimNames:
    kind: ApiEndpointClaim
    plural: apiendpointclaims
    
  # Versions defines the schema versions
  versions:
  - name: v1alpha1
    served: true  # This version is available via API
    referenceable: true  # This version can be referenced by other resources
    
    # Schema defines the OpenAPI v3 schema for this resource
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              # apiName: The name for the API Gateway API
              # This will be used to name the AWS resources
              apiName:
                type: string
                description: "Name of the API Gateway API"
                
              # description: Human-readable description
              description:
                type: string
                description: "Description of the API"
                
              # lambdaRuntime: Python runtime version
              # Default to python3.11 if not specified
              lambdaRuntime:
                type: string
                description: "Lambda runtime version"
                default: "python3.11"
                
            # Required fields that must be provided
            required:
            - apiName
            
          status:
            type: object
            properties:
              # endpointUrl: The live URL of the deployed API
              # This is populated from the API Gateway MR status
              endpointUrl:
                type: string
                description: "Live API Gateway endpoint URL"
                
              # deploymentTime: When the API was deployed
              # Populated from API Gateway MR creation timestamp
              deploymentTime:
                type: string
                description: "Deployment timestamp"
                
              # lambdaArn: ARN of the backing Lambda function
              # Useful for debugging and direct invocation
              lambdaArn:
                type: string
                description: "ARN of the Lambda function"
```

**Deliverables:**
- Complete ApiEndpoint XRD YAML
- Every field commented inline
- ~80-120 lines total

### Step 4.3: ApiEndpoint Composition - Complete YAML
**Content structure:**
```yaml
---
# ApiEndpoint Composition (Traditional Patches Approach)
# This composition creates Lambda + API Gateway + IAM using standard patches
# NO custom functions are used - all logic is declarative
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: apiendpoint-aws
  labels:
    # Label to associate this composition with the XRD
    crossplane.io/xrd: apiendpoints.example.com
    
spec:
  # compositeTypeRef specifies which XRD this implements
  compositeTypeRef:
    apiVersion: example.com/v1alpha1
    kind: ApiEndpoint
    
  # mode: "Pipeline" enables composition functions
  # We use "Resources" for traditional patch-and-transform
  mode: Resources
  
  # resources defines the MRs to create
  resources:
  
  # Resource 1: IAM Role for Lambda execution
  - name: lambda-role
    base:
      apiVersion: iam.aws.upbound.io/v1beta1
      kind: Role
      spec:
        forProvider:
          # assumeRolePolicy allows Lambda to assume this role
          assumeRolePolicy: |
            {
              "Version": "2012-10-17",
              "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
              }]
            }
    # Patches define how values flow from XR spec to MR spec
    patches:
    - type: FromCompositeFieldPath
      fromFieldPath: spec.apiName
      toFieldPath: metadata.name
      # Transform the API name into a role name
      transforms:
      - type: string
        string:
          fmt: "%s-lambda-role"
          
  # Resource 2: Lambda Function
  - name: lambda-function
    base:
      apiVersion: lambda.aws.upbound.io/v1beta1
      kind: Function
      spec:
        forProvider:
          # Inline code for the Lambda handler
          # Simple handler that returns different text per route
          code:
            zipFile: |
              def handler(event, context):
                  path = event.get('rawPath', '/')
                  return {
                      'statusCode': 200,
                      'headers': {'Content-Type': 'text/plain'},
                      'body': f'Hello from {path}!'
                  }
          
          # Handler is the entry point (file.function_name)
          handler: index.handler
          
          # Timeout in seconds
          timeout: 30
          
          # Memory allocation in MB
          memorySize: 128
          
    patches:
    # Patch the function name from spec.apiName
    - type: FromCompositeFieldPath
      fromFieldPath: spec.apiName
      toFieldPath: metadata.name
      transforms:
      - type: string
        string:
          fmt: "%s-function"
          
    # Patch the Lambda runtime from spec.lambdaRuntime
    - type: FromCompositeFieldPath
      fromFieldPath: spec.lambdaRuntime
      toFieldPath: spec.forProvider.runtime
      
    # Patch the IAM role reference
    # This creates a dependency: Lambda waits for Role to be ready
    - type: FromCompositeFieldPath
      fromFieldPath: spec.apiName
      toFieldPath: spec.forProvider.roleRef.name
      transforms:
      - type: string
        string:
          fmt: "%s-lambda-role"
          
    # STATUS PATCH: Extract Lambda ARN to XR status
    # This is how we populate status WITHOUT a custom function
    - type: ToCompositeFieldPath
      fromFieldPath: status.atProvider.arn
      toFieldPath: status.lambdaArn
      
  # Resource 3: API Gateway HTTP API
  - name: api-gateway
    base:
      apiVersion: apigatewayv2.aws.upbound.io/v1beta1
      kind: API
      spec:
        forProvider:
          # Protocol type (HTTP or WEBSOCKET)
          protocolType: HTTP
          
    patches:
    # Patch API name from spec.apiName
    - type: FromCompositeFieldPath
      fromFieldPath: spec.apiName
      toFieldPath: metadata.name
      
    - type: FromCompositeFieldPath
      fromFieldPath: spec.apiName
      toFieldPath: spec.forProvider.name
      
    # Patch description
    - type: FromCompositeFieldPath
      fromFieldPath: spec.description
      toFieldPath: spec.forProvider.description
      
    # STATUS PATCH: Extract API endpoint URL to XR status
    - type: ToCompositeFieldPath
      fromFieldPath: status.atProvider.apiEndpoint
      toFieldPath: status.endpointUrl
      
    # STATUS PATCH: Extract creation time
    - type: ToCompositeFieldPath
      fromFieldPath: status.atProvider.createdDate
      toFieldPath: status.deploymentTime
      
  # Resource 4: Lambda Permission (allows API Gateway to invoke Lambda)
  - name: lambda-permission
    base:
      apiVersion: lambda.aws.upbound.io/v1beta1
      kind: Permission
      spec:
        forProvider:
          action: lambda:InvokeFunction
          principal: apigateway.amazonaws.com
          
    patches:
    - type: FromCompositeFieldPath
      fromFieldPath: spec.apiName
      toFieldPath: metadata.name
      transforms:
      - type: string
        string:
          fmt: "%s-permission"
          
    # Reference the Lambda function
    - type: FromCompositeFieldPath
      fromFieldPath: spec.apiName
      toFieldPath: spec.forProvider.functionNameRef.name
      transforms:
      - type: string
        string:
          fmt: "%s-function"
```

**Deliverables:**
- Complete ApiEndpoint Composition YAML
- Heavy inline comments explaining patches
- ~150-200 lines total

### Step 4.4: ApiRoute XRD - Complete YAML
**Content structure:**
```yaml
---
# ApiRoute XRD Definition
# This XRD defines a route within an API Gateway
# It uses a PYTHON COMPOSITION FUNCTION to demonstrate custom logic
# Status fields are computed by the function, not propagated directly
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: apiroutes.example.com
  
spec:
  group: example.com
  
  names:
    kind: ApiRoute
    plural: apiroutes
    
  claimNames:
    kind: ApiRouteClaim
    plural: apirouteclaims
    
  versions:
  - name: v1alpha1
    served: true
    referenceable: true
    
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              # routePath: The HTTP path for this route (e.g., /hello)
              routePath:
                type: string
                description: "HTTP path for the route"
                pattern: '^/.*$'  # Must start with /
                
              # httpMethod: The HTTP method (GET, POST, etc.)
              httpMethod:
                type: string
                description: "HTTP method for the route"
                enum:
                - GET
                - POST
                - PUT
                - DELETE
                - PATCH
                
              # responseText: Custom text to return from this route
              # The Lambda will use this in its response
              responseText:
                type: string
                description: "Text response for this route"
                
              # apiEndpointRef: Reference to parent ApiEndpoint
              # This is a COMPOSITE RESOURCE REFERENCE
              # It links this route to its parent API
              apiEndpointRef:
                type: object
                description: "Reference to the parent ApiEndpoint"
                properties:
                  name:
                    type: string
                    description: "Name of the ApiEndpoint XR"
                required:
                - name
                
            required:
            - routePath
            - httpMethod
            - responseText
            - apiEndpointRef
            
          status:
            type: object
            properties:
              # routeStatus: Health of the route (computed by function)
              # The function will check MR statuses and compute this
              routeStatus:
                type: string
                description: "Route health status"
                
              # createdAt: When the route was created (computed by function)
              createdAt:
                type: string
                description: "Route creation timestamp"
                
              # integrationId: ID of the API Gateway integration
              # Useful for debugging
              integrationId:
                type: string
                description: "API Gateway Integration ID"
```

**Deliverables:**
- Complete ApiRoute XRD YAML
- Inline comments explaining composite resource ref
- ~80-100 lines total

### Step 4.5: Python Composition Function - Complete Code
**Content structure:**
```python
"""
ApiRoute Composition Function
==============================
This function processes ApiRoute composite resources and:
1. Reads the parent ApiEndpoint reference
2. Creates API Gateway Route and Integration resources
3. Computes custom status fields based on MR statuses
4. Demonstrates when/why you need custom logic vs traditional patches

This is deployed as a containerized function in the cluster.
"""

# Crossplane function SDK imports
from crossplane.function import resource
from crossplane.function.proto.v1 import run_function_pb2 as fnv1

# Standard library imports
import json
from datetime import datetime


def compose(req: fnv1.RunFunctionRequest, rsp: fnv1.RunFunctionResponse):
    """
    Main composition function handler.
    
    Args:
        req: Request containing observed and desired state
        rsp: Response to populate with desired state and status
    
    The function receives:
    - req.observed.composite: The current XR state
    - req.observed.resources: Current MR states
    - req.desired.composite: Desired XR state (from previous pipeline steps)
    - req.desired.resources: Desired MR states (from previous pipeline steps)
    
    The function must populate:
    - rsp.desired.resources: MRs to create/update
    - rsp.desired.composite.status: Custom status fields
    """
    
    # Extract the composite resource (our ApiRoute XR)
    xr = req.observed.composite.resource
    
    # Get spec fields from the XR
    # These come from the user's ApiRoute YAML
    route_path = xr.get("spec", {}).get("routePath", "/")
    http_method = xr.get("spec", {}).get("httpMethod", "GET")
    response_text = xr.get("spec", {}).get("responseText", "Hello!")
    
    # Get the parent ApiEndpoint reference
    # This is how we link to the parent composite resource
    api_endpoint_ref = xr.get("spec", {}).get("apiEndpointRef", {})
    parent_name = api_endpoint_ref.get("name", "")
    
    # RESOURCE 1: API Gateway Route
    # This creates the HTTP route in the API Gateway
    route_resource = {
        "apiVersion": "apigatewayv2.aws.upbound.io/v1beta1",
        "kind": "Route",
        "metadata": {
            "name": f"{parent_name}-{http_method.lower()}{route_path.replace('/', '-')}",
            # Use labels to track ownership
            "labels": {
                "crossplane.io/composite": xr.get("metadata", {}).get("name", ""),
            }
        },
        "spec": {
            "forProvider": {
                # routeKey defines the route pattern
                # Format: "METHOD /path"
                "routeKey": f"{http_method} {route_path}",
                
                # target references the integration
                # We'll create this in the next resource
                "target": f"integrations/${{integration_id}}",
                
                # Reference the parent API Gateway
                # This uses a cross-resource reference
                # The apiIdRef will resolve to the actual API ID
                "apiIdSelector": {
                    "matchLabels": {
                        "crossplane.io/composite": parent_name
                    }
                }
            }
        }
    }
    
    # RESOURCE 2: API Gateway Integration
    # This connects the route to the Lambda function
    integration_resource = {
        "apiVersion": "apigatewayv2.aws.upbound.io/v1beta1",
        "kind": "Integration",
        "metadata": {
            "name": f"{parent_name}-integration-{http_method.lower()}{route_path.replace('/', '-')}",
            "labels": {
                "crossplane.io/composite": xr.get("metadata", {}).get("name", ""),
            }
        },
        "spec": {
            "forProvider": {
                # integrationType: How API Gateway connects to backend
                # AWS_PROXY means Lambda proxy integration
                "integrationType": "AWS_PROXY",
                
                # integrationMethod: Always POST for Lambda proxy
                "integrationMethod": "POST",
                
                # integrationUri: ARN of the Lambda function
                # We need to get this from the parent ApiEndpoint
                # For now, we'll use a selector to find it
                "integrationUri": f"arn:aws:lambda:us-east-1:123456789012:function:{parent_name}-function",
                
                # Reference the parent API Gateway
                "apiIdSelector": {
                    "matchLabels": {
                        "crossplane.io/composite": parent_name
                    }
                },
                
                # payloadFormatVersion: 2.0 for HTTP APIs
                "payloadFormatVersion": "2.0"
            }
        }
    }
    
    # Add resources to desired state
    # These will be created/updated by Crossplane
    rsp.desired.resources["route"].resource.CopyFrom(
        resource.dict_to_struct(route_resource)
    )
    rsp.desired.resources["integration"].resource.CopyFrom(
        resource.dict_to_struct(integration_resource)
    )
    
    # COMPUTE CUSTOM STATUS FIELDS
    # This is why we're using a function instead of traditional patches
    # We can aggregate data from multiple MRs and compute new values
    
    # Check if MRs are ready
    route_ready = False
    integration_ready = False
    integration_id = ""
    
    # Look for Route MR in observed resources
    if "route" in req.observed.resources:
        route_mr = req.observed.resources["route"].resource
        route_status = route_mr.get("status", {}).get("conditions", [])
        # Check if Ready condition is True
        for condition in route_status:
            if condition.get("type") == "Ready" and condition.get("status") == "True":
                route_ready = True
                
    # Look for Integration MR in observed resources
    if "integration" in req.observed.resources:
        integration_mr = req.observed.resources["integration"].resource
        integration_status = integration_mr.get("status", {}).get("conditions", [])
        for condition in integration_status:
            if condition.get("type") == "Ready" and condition.get("status") == "True":
                integration_ready = True
        # Get integration ID from status
        integration_id = integration_mr.get("status", {}).get("atProvider", {}).get("id", "")
    
    # Compute overall route status
    if route_ready and integration_ready:
        computed_status = "Ready"
    elif route_ready or integration_ready:
        computed_status = "PartiallyReady"
    else:
        computed_status = "Pending"
    
    # Get creation timestamp
    created_at = datetime.utcnow().isoformat() + "Z"
    if "route" in req.observed.resources:
        route_mr = req.observed.resources["route"].resource
        created_at = route_mr.get("metadata", {}).get("creationTimestamp", created_at)
    
    # Populate status fields in XR
    # This is custom computation that traditional patches can't do
    status = {
        "routeStatus": computed_status,
        "createdAt": created_at,
        "integrationId": integration_id
    }
    
    # Write status to desired composite
    if not hasattr(rsp.desired, 'composite'):
        rsp.desired.composite.CopyFrom(req.desired.composite)
    
    # Update status fields
    composite_dict = resource.struct_to_dict(rsp.desired.composite.resource)
    if "status" not in composite_dict:
        composite_dict["status"] = {}
    composite_dict["status"].update(status)
    
    rsp.desired.composite.resource.CopyFrom(
        resource.dict_to_struct(composite_dict)
    )
    
    # Return response
    # Crossplane will apply these desired resources and status
    return rsp


# Function entry point
if __name__ == "__main__":
    from crossplane.function import logging
    logging.run(compose)
```

**Deliverables:**
- Complete Python function code
- Extensive inline comments (200+ lines with comments)
- Explains WHY function is needed vs patches

### Step 4.6: Function Deployment Files
**Content structure:**

**Dockerfile:**
```dockerfile
# Dockerfile for ApiRoute Composition Function
# This packages the Python function into a container

FROM python:3.11-slim

# Install Crossplane function SDK
# This provides the gRPC framework and helpers
RUN pip install --no-cache-dir crossplane-function

# Copy function code
COPY function.py /function.py

# The function runs as a gRPC server
# Crossplane will call it via gRPC during composition
ENTRYPOINT ["python", "/function.py"]
```

**Function package YAML:**
```yaml
---
# Function Package Definition
# This tells Crossplane how to deploy the function
apiVersion: pkg.crossplane.io/v1beta1
kind: Function
metadata:
  name: function-apiroute
spec:
  # The container image with our function code
  # In practice, this would be pushed to a registry
  package: localhost:5000/function-apiroute:v1.0.0
```

**Deliverables:**
- Dockerfile with comments
- Function package YAML with comments
- Build/push instructions (commented)

### Step 4.7: ApiRoute Composition - Complete YAML
**Content structure:**
```yaml
---
# ApiRoute Composition (Function-Based Approach)
# This composition uses a Python function for custom logic
# Compare with ApiEndpoint composition to see the difference
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: apiroute-aws
  labels:
    crossplane.io/xrd: apiroutes.example.com
    
spec:
  compositeTypeRef:
    apiVersion: example.com/v1alpha1
    kind: ApiRoute
    
  # mode: "Pipeline" enables composition functions
  # This is different from ApiEndpoint which uses "Resources"
  mode: Pipeline
  
  # pipeline defines the steps for composing resources
  # Functions run in order, each can modify desired state
  pipeline:
  
  # Step 1: Run our custom Python function
  # This function creates the Route and Integration resources
  # It also computes custom status fields
  - step: apply-apiroute-function
    functionRef:
      # Reference to the deployed Function package
      name: function-apiroute
      
  # Step 2: Traditional patch-and-transform (optional)
  # We could add patches here after the function runs
  # For this example, the function does everything
  # - step: patch-and-transform
  #   functionRef:
  #     name: function-patch-and-transform
```

**Deliverables:**
- Complete ApiRoute Composition YAML
- Comments explaining pipeline mode
- ~30-40 lines total

### Step 4.8: Example Usage - Creating Resources
**Content structure:**

**Example 1: Create ApiEndpoint**
```yaml
---
# Example ApiEndpoint Instance
# This creates an API Gateway + Lambda using traditional patches
apiVersion: example.com/v1alpha1
kind: ApiEndpoint
metadata:
  name: my-api
  # This is a cluster-scoped XR (not a claim)
  
spec:
  # apiName: Name for the API Gateway API
  apiName: my-api
  
  # description: Human-readable description
  description: "My example API for learning Crossplane"
  
  # lambdaRuntime: Python runtime version
  # This defaults to python3.11 if not specified
  lambdaRuntime: python3.11

---
# After applying, check status with:
# kubectl get apiendpoint my-api -o yaml
# 
# Expected status fields:
# status:
#   endpointUrl: https://abc123.execute-api.us-east-1.amazonaws.com
#   deploymentTime: "2025-01-15T10:30:00Z"
#   lambdaArn: arn:aws:lambda:us-east-1:123456789012:function:my-api-function
```

**Example 2: Create ApiRoutes**
```yaml
---
# Example ApiRoute Instance 1: GET /hello
# This uses the Python function to create route + integration
apiVersion: example.com/v1alpha1
kind: ApiRoute
metadata:
  name: hello-route
  
spec:
  # routePath: HTTP path (must start with /)
  routePath: /hello
  
  # httpMethod: HTTP verb
  httpMethod: GET
  
  # responseText: What the Lambda returns
  responseText: "Hello from the /hello route!"
  
  # apiEndpointRef: Link to parent ApiEndpoint
  # This is a COMPOSITE RESOURCE REFERENCE
  apiEndpointRef:
    name: my-api  # Must match an existing ApiEndpoint

---
# Example ApiRoute Instance 2: POST /data
apiVersion: example.com/v1alpha1
kind: ApiRoute
metadata:
  name: data-route
  
spec:
  routePath: /data
  httpMethod: POST
  responseText: "Data received via POST!"
  apiEndpointRef:
    name: my-api

---
# After applying, check status with:
# kubectl get apiroute hello-route -o yaml
#
# Expected status fields (computed by function):
# status:
#   routeStatus: "Ready"
#   createdAt: "2025-01-15T10:35:00Z"
#   integrationId: "abc123"
```

**Deliverables:**
- 1 ApiEndpoint instance YAML (commented)
- 2 ApiRoute instance YAMLs (commented)
- Expected status outputs (commented)

### Step 4.9: Verifying Status Fields & Testing
**Content structure:**
```bash
#!/bin/bash
# Status Verification and Testing Script
# This shows how to check status fields and test the live API

# Step 1: Check ApiEndpoint status
# This uses BUILT-IN status propagation (no function)
echo "Checking ApiEndpoint status..."
kubectl get apiendpoint my-api -o jsonpath='{.status}' | jq

# Expected output:
# {
#   "endpointUrl": "https://abc123.execute-api.us-east-1.amazonaws.com",
#   "deploymentTime": "2025-01-15T10:30:00Z",
#   "lambdaArn": "arn:aws:lambda:us-east-1:123456789012:function:my-api-function"
# }

# Step 2: Check ApiRoute status
# This uses FUNCTION-COMPUTED status (custom logic)
echo "Checking ApiRoute status..."
kubectl get apiroute hello-route -o jsonpath='{.status}' | jq

# Expected output:
# {
#   "routeStatus": "Ready",
#   "createdAt": "2025-01-15T10:35:00Z",
#   "integrationId": "abc123"
# }

# Step 3: Test the live API endpoint
# Extract the endpoint URL from ApiEndpoint status
ENDPOINT_URL=$(kubectl get apiendpoint my-api -o jsonpath='{.status.endpointUrl}')

echo "Testing GET /hello route..."
curl "${ENDPOINT_URL}/hello"
# Expected output: Hello from the /hello route!

echo "Testing POST /data route..."
curl -X POST "${ENDPOINT_URL}/data"
# Expected output: Data received via POST!

# Step 4: Watch status updates in real-time
echo "Watching ApiRoute status updates..."
kubectl get apiroute hello-route -o jsonpath='{.status}' -w

# This shows how status fields update as MRs become ready
# You'll see routeStatus change from "Pending" → "PartiallyReady" → "Ready"
```

**Deliverables:**
- Complete verification script (commented)
- Expected outputs (commented)
- Explanation of status update timing

### Step 4.10: Cleanup Instructions
**Content structure:**
```bash
#!/bin/bash
# Cleanup Script
# Delete resources in the correct order to avoid orphaned AWS resources

# Step 1: Delete ApiRoute instances first
# This prevents orphaned API Gateway routes
echo "Deleting ApiRoutes..."
kubectl delete apiroute hello-route
kubectl delete apiroute data-route

# Wait for routes to be fully deleted
echo "Waiting for routes to be deleted..."
kubectl wait --for=delete apiroute/hello-route --timeout=300s
kubectl wait --for=delete apiroute/data-route --timeout=300s

# Step 2: Delete ApiEndpoint instance
# This will delete Lambda, API Gateway, and IAM resources
echo "Deleting ApiEndpoint..."
kubectl delete apiendpoint my-api

# Wait for full deletion
echo "Waiting for API endpoint to be deleted..."
kubectl wait --for=delete apiendpoint/my-api --timeout=300s

# Step 3: Verify all AWS resources are cleaned up
echo "Verifying cleanup..."
kubectl get managed

# Should show no resources related to my-api

# Note: If you want to delete the XRDs and Compositions too:
# kubectl delete xrd apiendpoints.example.com
# kubectl delete xrd apiroutes.example.com
# kubectl delete composition apiendpoint-aws
# kubectl delete composition apiroute-aws
# kubectl delete function function-apiroute
```

**Deliverables:**
- Complete cleanup script (commented)
- Deletion order explanation
- Verification steps

## Phase 5: Diagram Creation

### Diagrams List (in order of creation):

1. **System Architecture** (Layer 1, Step 2.2)
2. **Workflow Mini-Diagrams** (Layer 1, Step 2.3) - 9 diagrams
3. **Comparison Table** (Layer 1, Step 2.4)
4. **ApiEndpoint Schema** (Layer 2, Step 3.1)
5. **ApiEndpoint Status Flow** (Layer 2, Step 3.1)
6. **ApiEndpoint Resource Dependency Graph** (Layer 2, Step 3.2)
7. **ApiEndpoint Patch Flow** (Layer 2, Step 3.2)
8. **ApiRoute Schema** (Layer 2, Step 3.3)
9. **ApiRoute Parent Reference** (Layer 2, Step 3.3)
10. **ApiRoute Status Computation Flow** (Layer 2, Step 3.3)
11. **ApiRoute Pipeline** (Layer 2, Step 3.4)
12. **ApiRoute Resource Creation** (Layer 2, Step 3.4)
13. **Function Inputs/Outputs** (Layer 2, Step 3.4)
14. **Built-in Status Propagation** (Layer 2, Step 3.5)
15. **Function Status Computation** (Layer 2, Step 3.6)
16. **Function I/O Detail** (Layer 2, Step 3.7)
17. **Function Deployment Architecture** (Layer 2, Step 3.7)
18. **Decision Tree** (Layer 2, Step 3.8)
19. **Side-by-Side Comparison** (Layer 2, Step 3.8)

## Phase 6: Quality Assurance Checklist

- [ ] All YAML is syntactically valid for Crossplane v2.1
- [ ] AWS upbound provider MR schemas are accurate (Dec 2025)
- [ ] Python function code is tested and functional
- [ ] All diagrams are clear and accurate
- [ ] Code comments are educational, not just descriptive
- [ ] Layer 1 contains zero code
- [ ] Layer 2 contains only small snippets (5-15 lines max)
- [ ] Layer 3 code is complete and heavily commented
- [ ] Workflow is logical for Terraform users
- [ ] ApiEndpoint clearly shows traditional patches approach
- [ ] ApiRoute clearly shows function-based approach
- [ ] Status field differences are highlighted
- [ ] Composite resource refs are correctly demonstrated
- [ ] Lambda code is minimal but complete
- [ ] All file paths and names are consistent
- [ ] No extra "helpful" content beyond what was requested
