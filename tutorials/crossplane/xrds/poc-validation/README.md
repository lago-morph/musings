# POC Validation Directory

This directory contains all files for Phase 3 technical validation of the XRD tutorial concepts. It validates core technical assumptions before major tutorial content investment.

## Directory Structure

```
poc-validation/
├── README.md                    # Overview of POC validation structure
├── apiendpoint/                 # Traditional patches pattern
│   ├── xrd-apiendpoint.yaml     # XRD definition
│   ├── composition-apiendpoint.yaml  # Composition with traditional patches
│   └── example-apiendpoint.yaml # Example instance for testing
├── apiroute/                    # Composition functions pattern
│   ├── xrd-apiroute.yaml        # XRD definition
│   ├── composition-apiroute.yaml # Composition with Python function
│   ├── function/                # Python composition function
│   │   ├── main.py              # Function implementation
│   │   ├── requirements.txt     # Python dependencies
│   │   └── Dockerfile           # Container build
│   └── example-apiroute.yaml    # Example instance for testing
├── integration/                 # End-to-end testing
│   ├── deploy-all.yaml          # Complete deployment example
│   └── test-endpoints.sh        # Validation script for live endpoints
└── cleanup/
    └── cleanup-all.yaml         # Resource cleanup manifests
```

## Directory Structure

### `apiendpoint/` - Traditional Patches Pattern
Contains XRD, Composition, and examples demonstrating traditional patch-and-transform patterns:
- `xrd-apiendpoint.yaml` - XRD definition with spec and status schema
- `composition-apiendpoint.yaml` - Composition using traditional patches (ToCompositeFieldPath, etc.)
- `example-apiendpoint.yaml` - Example instance for testing deployment

**Validates**: Traditional declarative composition patterns, built-in status propagation

### `apiroute/` - Composition Functions Pattern  
Contains XRD, Composition, and Python function demonstrating custom logic patterns:
- `xrd-apiroute.yaml` - XRD definition with parent resource references
- `composition-apiroute.yaml` - Composition using Pipeline mode with Python function
- `function/` - Python composition function implementation
  - `main.py` - Function logic for dependency resolution and status computation
  - `requirements.txt` - Python dependencies (crossplane SDK, boto3)
  - `Dockerfile` - Container build for ttl.sh deployment
- `example-apiroute.yaml` - Example instance referencing ApiEndpoint

**Validates**: Custom composition functions, dependency resolution, external API integration

### `integration/` - End-to-End Testing
Contains complete deployment and validation scenarios:
- `deploy-all.yaml` - Complete working example (ApiEndpoint + ApiRoute)
- `test-endpoints.sh` - Script to test live API Gateway endpoints with curl

**Validates**: Full workflow from XRD to working API endpoints

### `cleanup/` - Resource Management
Contains manifests for cleaning up POC resources:
- `cleanup-all.yaml` - Removes all POC resources in correct order

## Usage

### Deploy Individual Components
```bash
# Deploy ApiEndpoint XRD and Composition
kubectl apply -f apiendpoint/

# Deploy ApiRoute XRD and Composition (after building function)
kubectl apply -f apiroute/

# Test complete integration
kubectl apply -f integration/
```

### Build and Deploy Python Function
```bash
cd apiroute/function/
docker build -t ttl.sh/xrd-tutorial-function:24h .
docker push ttl.sh/xrd-tutorial-function:24h
```

### Validate Deployment
```bash
# Check XRDs are established
kubectl get xrd

# Check compositions are ready
kubectl get composition

# Test live endpoints
./integration/test-endpoints.sh
```

### Cleanup
```bash
kubectl delete -f integration/
kubectl delete -f apiroute/
kubectl delete -f apiendpoint/
# or
kubectl apply -f cleanup/cleanup-all.yaml
```

## Validation Criteria

Each component must satisfy specific validation criteria:

**ApiEndpoint (3.2.x tasks)**:
- XRD registers successfully with Crossplane
- Composition creates Lambda + API Gateway + IAM resources
- Status fields populate using ToCompositeFieldPath patches
- API Gateway endpoint responds to HTTP requests
- Lambda function executes and logs to CloudWatch

**ApiRoute (3.3.x tasks)**:
- XRD registers with parent resource references
- Python function builds and deploys to ttl.sh
- Composition uses Pipeline mode with function
- Function resolves dependencies and computes status
- CloudWatch integration retrieves real metrics

**Integration (3.5.x tasks)**:
- Complete deployment works end-to-end
- Dependency resolution timing works correctly
- Live API endpoints respond with expected output
- Status fields populate with real CloudWatch data
- Resource cleanup works in correct order

## Success Criteria

POC validation is successful when:
- All XRDs and Compositions deploy without Crossplane errors
- AWS resources are created as specified in technical specification  
- Status fields populate correctly using both built-in and custom approaches
- Dependency resolution timing works as designed
- Basic CloudWatch integration functions with graceful error handling
- Live API endpoints respond correctly to HTTP requests

This validates that the tutorial's technical assumptions are sound and implementation is feasible.