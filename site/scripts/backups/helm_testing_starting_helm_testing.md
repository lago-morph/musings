# Testing Complex Helm Charts: A Practical Guide

You're asking the right question. Most Helm charts in production have **zero tests**, and teams discover bugs when they blow up in staging (or worse, production). Let me walk you through this systematically.

---

## **Understanding What You're Testing**

A Helm chart has **three** distinct failure modes:

1. **Template rendering failures** - YAML doesn't compile
2. **Kubernetes validation failures** - Valid YAML, invalid K8s resources
3. **Runtime failures** - Deploys successfully but doesn't work

Each needs different testing approaches.

---

## **Step 0: Audit Your Current Chart**

Before writing tests, understand what you have:

```bash
# 1. How complex is it?
find charts/my-app/templates -name "*.yaml" | wc -l

# 2. How many values are there?
yq eval '..' charts/my-app/values.yaml | grep -c '^'

# 3. What conditional logic exists?
grep -r "{{- if" charts/my-app/templates/ | wc -l

# 4. How many helpers?
grep -c "define" charts/my-app/templates/_helpers.tpl
```

**Example output:**
```
23 template files
147 configurable values
38 conditional blocks
12 helper functions
```

**Translation:** This chart is complex. You need tests.

---

## **Phase 1: Unit Tests (Testing Template Rendering)**

### Tool: `helm unittest` (Start Here)

**Install:**
```bash
helm plugin install https://github.com/helm-unittest/helm-unittest
```

### Your First Test (5 minutes)

```bash
# Create test directory
mkdir -p charts/my-app/tests

# Create your first test file
cat > charts/my-app/tests/deployment_test.yaml <<'EOF'
suite: test deployment
templates:
  - deployment.yaml
tests:
  - it: should create a deployment
    asserts:
      - isKind:
          of: Deployment
      - equal:
          path: metadata.name
          value: RELEASE-NAME-my-app
EOF
```

**Run it:**
```bash
helm unittest charts/my-app

# Output:
### Chart [ my-app ] charts/my-app
 PASS  test deployment	charts/my-app/tests/deployment_test.yaml

Charts:      1 passed, 1 total
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

**You just wrote your first test in 5 minutes.** 🎉

---

### Real-World Example: Testing Conditional Logic

Your chart probably has something like this:

```yaml
# templates/deployment.yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "my-app.fullname" . }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "my-app.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
{{- end }}
```

**The test:**
```yaml
# tests/hpa_test.yaml
suite: test horizontal pod autoscaler
templates:
  - hpa.yaml
tests:
  - it: should not create HPA when autoscaling is disabled
    set:
      autoscaling.enabled: false
    asserts:
      - hasDocuments:
          count: 0

  - it: should create HPA when autoscaling is enabled
    set:
      autoscaling.enabled: true
      autoscaling.minReplicas: 2
      autoscaling.maxReplicas: 10
    asserts:
      - isKind:
          of: HorizontalPodAutoscaler
      - equal:
          path: spec.minReplicas
          value: 2
      - equal:
          path: spec.maxReplicas
          value: 10

  - it: should target the correct deployment
    set:
      autoscaling.enabled: true
    asserts:
      - equal:
          path: spec.scaleTargetRef.kind
          value: Deployment
      - equal:
          path: spec.scaleTargetRef.name
          value: RELEASE-NAME-my-app
```

---

### Testing Complex Value Combinations

**Common bug:** Chart works with default values, breaks with custom values.

```yaml
# tests/deployment_resources_test.yaml
suite: test resource limits
templates:
  - deployment.yaml
tests:
  - it: should use default resources when not specified
    asserts:
      - equal:
          path: spec.template.spec.containers[0].resources.requests.cpu
          value: 100m
      - equal:
          path: spec.template.spec.containers[0].resources.requests.memory
          value: 128Mi

  - it: should override resources when specified
    set:
      resources.requests.cpu: 500m
      resources.requests.memory: 512Mi
      resources.limits.cpu: 1000m
      resources.limits.memory: 1Gi
    asserts:
      - equal:
          path: spec.template.spec.containers[0].resources.requests.cpu
          value: 500m
      - equal:
          path: spec.template.spec.containers[0].resources.limits.memory
          value: 1Gi

  - it: should allow disabling resource limits
    set:
      resources: {}
    asserts:
      - isNull:
          path: spec.template.spec.containers[0].resources
```

---

### Testing Helper Functions

Your `_helpers.tpl` probably has something like:

```yaml
{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "my-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}
```

**Test it:**
```yaml
# tests/helpers_test.yaml
suite: test helper functions
templates:
  - deployment.yaml  # Any template that uses the helper
tests:
  - it: should generate correct chart label
    chart:
      version: 1.2.3+build.456  # Chart version with +
    asserts:
      - equal:
          path: metadata.labels["helm.sh/chart"]
          value: my-app-1.2.3_build.456  # + replaced with _
```

---

### Testing Schema Validation (Values Validation)

**Create a values schema:**
```yaml
# values.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": {
          "type": "string"
        },
        "tag": {
          "type": "string"
        }
      }
    },
    "autoscaling": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "minReplicas": {
          "type": "integer",
          "minimum": 1
        },
        "maxReplicas": {
          "type": "integer",
          "minimum": 1
        }
      },
      "if": {
        "properties": { "enabled": { "const": true } }
      },
      "then": {
        "required": ["minReplicas", "maxReplicas"]
      }
    }
  }
}
```

**Test schema validation:**
```bash
# This should fail
helm install my-app charts/my-app \
  --set replicaCount=200 \
  --dry-run

# Error: values don't meet the specifications of the schema
```

---

## **Phase 2: Integration Tests (Testing Against Real Kubernetes)**

### Tool: `ct` (Chart Testing)

**Install:**
```bash
# Install chart-testing
brew install chart-testing  # macOS
# or
pip install yamllint yamale

# Install kind for local k8s cluster
brew install kind
```

### Setup

```bash
# Create ct config
cat > ct.yaml <<'EOF'
chart-dirs:
  - charts
chart-repos:
  - bitnami=https://charts.bitnami.com/bitnami
helm-extra-args: --timeout 600s
validate-maintainers: false
EOF
```

**Create test values:**
```yaml
# charts/my-app/ci/default-values.yaml
# Minimal viable deployment
replicaCount: 1
image:
  repository: nginx
  tag: "1.21"
```

```yaml
# charts/my-app/ci/production-like-values.yaml
# Production-like configuration
replicaCount: 3
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
ingress:
  enabled: true
  hosts:
    - host: test.example.com
      paths:
        - path: /
          pathType: Prefix
```

**Run integration tests:**
```bash
# Create local k8s cluster
kind create cluster --name chart-testing

# Install and test the chart
ct install --charts charts/my-app

# Output:
# Installing chart 'my-app' with values files:
#  - charts/my-app/ci/default-values.yaml
#  - charts/my-app/ci/production-like-values.yaml
# ✓ Chart installed successfully
# ✓ All pods became ready
```

---

### Custom Integration Tests with YAML

```yaml
# charts/my-app/ci/test-values.yaml
# This will actually deploy and run tests
image:
  repository: nginx
  tag: "1.21"

# Enable test job
tests:
  enabled: true
```

**Create test pod template:**
```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "my-app.fullname" . }}-test-connection"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: wget
      image: busybox
      command: ['wget']
      args: ['{{ include "my-app.fullname" . }}:{{ .Values.service.port }}']
  restartPolicy: Never
```

**Run the test:**
```bash
helm install my-app charts/my-app
helm test my-app

# Output:
# NAME: my-app
# LAST DEPLOYED: ...
# NAMESPACE: default
# STATUS: deployed
# TEST SUITE:     my-app-test-connection
# Last Started:   ...
# Last Completed: ...
# Phase:          Succeeded
```

---

## **Phase 3: Advanced Testing Patterns**

### Testing with Multiple Kubernetes Versions

```yaml
# .github/workflows/chart-test.yaml
name: Lint and Test Charts

on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        k8s-version:
          - v1.24.0
          - v1.25.0
          - v1.26.0
          - v1.27.0
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up chart-testing
        uses: helm/chart-testing-action@v2
      
      - name: Create kind cluster
        uses: helm/kind-action@v1
        with:
          node_image: kindest/node:${{ matrix.k8s-version }}
      
      - name: Run chart-testing (install)
        run: ct install --charts charts/my-app
```

---

### Snapshot Testing

**Problem:** You want to detect ANY change in rendered output.

```yaml
# tests/snapshot_test.yaml
suite: snapshot tests
templates:
  - deployment.yaml
  - service.yaml
  - ingress.yaml
tests:
  - it: should match snapshot for default values
    asserts:
      - matchSnapshot: {}

  - it: should match snapshot for production config
    values:
      - ../ci/production-like-values.yaml
    asserts:
      - matchSnapshot: {}
```

**First run creates snapshots:**
```bash
helm unittest charts/my-app --update-snapshot
```

**Future runs detect changes:**
```bash
helm unittest charts/my-app

# If output changed:
# FAIL  should match snapshot for default values
#   - asserts[0] `matchSnapshot` fail
#     Template:	charts/my-app/templates/deployment.yaml
#     Expected to match snapshot but got diff:
#     --- Expected
#     +++ Actual
#     @@ -15,7 +15,7 @@
#     -      replicas: 1
#     +      replicas: 3
```

---

### Security & Policy Testing

**Using Polaris:**
```bash
# Install polaris
helm repo add fairwinds-stable https://charts.fairwinds.com/stable
helm install polaris fairwinds-stable/polaris --namespace polaris --create-namespace

# Test your chart against best practices
helm template my-app charts/my-app | polaris audit --format=pretty

# Output:
# Results for kind Deployment:
#   my-app
#     ✓ hostIPCSet: Host IPC is not configured
#     ✓ hostPIDSet: Host PID is not configured
#     ✗ runAsNonRoot: Should not be allowed to run as root
#     ✗ readOnlyRootFilesystem: Root filesystem should be read-only
```

**Using Checkov:**
```bash
# Install checkov
pip install checkov

# Scan rendered templates
helm template my-app charts/my-app > /tmp/my-app.yaml
checkov -f /tmp/my-app.yaml --framework kubernetes

# Output:
# kubernetes scan results:
# Passed checks: 15, Failed checks: 8, Skipped checks: 0
# 
# Check: CKV_K8S_8: "Liveness Probe Should Be Configured"
# 	FAILED for resource: Deployment.default.my-app
# 	File: /tmp/my-app.yaml:1-50
```

---

## **Quick Start: Test Your Chart in 30 Minutes**

### Minute 0-10: Basic Unit Tests

```bash
# Install helm unittest
helm plugin install https://github.com/helm-unittest/helm-unittest

# Create test directory
mkdir -p charts/my-app/tests

# Test the most critical template (usually deployment)
cat > charts/my-app/tests/deployment_test.yaml <<'EOF'
suite: deployment tests
templates:
  - deployment.yaml
tests:
  - it: should create a Deployment
    asserts:
      - isKind:
          of: Deployment
      
  - it: should use correct image
    set:
      image.repository: myapp
      image.tag: "1.0.0"
    asserts:
      - equal:
          path: spec.template.spec.containers[0].image
          value: myapp:1.0.0
      
  - it: should set replica count
    set:
      replicaCount: 5
    asserts:
      - equal:
          path: spec.replicas
          value: 5
EOF

# Run tests
helm unittest charts/my-app
```

### Minute 10-20: Test Conditionals

```bash
cat > charts/my-app/tests/conditionals_test.yaml <<'EOF'
suite: conditional resource tests
templates:
  - ingress.yaml
tests:
  - it: should not create Ingress when disabled
    set:
      ingress.enabled: false
    asserts:
      - hasDocuments:
          count: 0
  
  - it: should create Ingress when enabled
    set:
      ingress.enabled: true
      ingress.hosts[0].host: example.com
    asserts:
      - isKind:
          of: Ingress
      - contains:
          path: spec.rules
          content:
            host: example.com
EOF

helm unittest charts/my-app
```

### Minute 20-30: Integration Test Setup

```bash
# Create test values
cat > charts/my-app/ci/test-values.yaml <<'EOF'
replicaCount: 1
image:
  repository: nginx
  tag: "1.21"
service:
  type: ClusterIP
  port: 80
EOF

# Create kind cluster
kind create cluster --name test

# Install chart
helm install test-release charts/my-app -f charts/my-app/ci/test-values.yaml

# Verify deployment
kubectl get all
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=my-app --timeout=60s

# Success? You have a working integration test!
# Cleanup
kind delete cluster --name test
```

---

## **Common Patterns to Test**

### 1. Security Context
```yaml
tests:
  - it: should run as non-root when securityContext is set
    set:
      securityContext.runAsNonRoot: true
      securityContext.runAsUser: 1000
    asserts:
      - equal:
          path: spec.template.spec.securityContext.runAsNonRoot
          value: true
      - equal:
          path: spec.template.spec.securityContext.runAsUser
          value: 1000
```

### 2. Resource Limits
```yaml
tests:
  - it: should fail if CPU limits are too low
    set:
      resources.limits.cpu: 10m
    asserts:
      - failedTemplate:
          errorMessage: "CPU limit too low, minimum is 100m"
```

### 3. Volume Mounts
```yaml
tests:
  - it: should mount config volume when configMap is provided
    set:
      configMap.enabled: true
      configMap.data:
        config.yaml: "test: data"
    asserts:
      - contains:
          path: spec.template.spec.volumes
          content:
            name: config
            configMap:
              name: RELEASE-NAME-my-app
      - contains:
          path: spec.template.spec.containers[0].volumeMounts
          content:
            name: config
            mountPath: /config
```

---

## **CI/CD Integration**

### GitHub Actions
```yaml
# .github/workflows/helm-test.yaml
name: Helm Chart Testing

on:
  pull_request:
    paths:
      - 'charts/**'

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Helm
        uses: azure/setup-helm@v3
      
      - name: Install helm-unittest
        run: helm plugin install https://github.com/helm-unittest/helm-unittest
      
      - name: Run unit tests
        run: helm unittest charts/my-app
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: charts/my-app/tests/*.xml

  integration-test:
    runs-on: ubuntu-latest
    needs: unit-test
    steps:
      - uses: actions/checkout@v3
      
      - name: Create kind cluster
        uses: helm/kind-action@v1
      
      - name: Install chart-testing
        uses: helm/chart-testing-action@v2
      
      - name: Run integration tests
        run: ct install --charts charts/my-app
```

---

## **Where to Start with YOUR Chart**

**Day 1 Checklist:**

1. ✅ Install `helm unittest`
2. ✅ Create `charts/my-app/tests/` directory
3. ✅ Write ONE test for your most critical template
4. ✅ Run it: `helm unittest charts/my-app`

**Week 1 Goal:**
- Test all conditional logic (`{{- if }}` blocks)
- Test value overrides for critical settings
- Achieve >50% template coverage

**Week 2 Goal:**
- Add values schema validation
- Create 2-3 CI test value files
- Set up integration testing with kind

**Month 1 Goal:**
- Tests in CI/CD pipeline
- Snapshot tests for stability
- Security scanning integrated

Start small. One test is infinitely better than zero tests. You got this! 🚀
