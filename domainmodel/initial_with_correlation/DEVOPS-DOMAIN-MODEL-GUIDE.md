---
title: "DevOps Domain Model: Implementation Guide"
summary: "This guide shows how to impose a unified domain model on distributed DevOps infrastructure (Git, Docker, Kubernetes, CI/CD, logs) for consolidated visibility and consistency checking. Covers DevOps Domain Model: Implementation Guide, Overview, Why This Approach Works for DevOps."
keywords:
  - "deployment"
  - "docker"
  - "json"
  - "container"
  - "k8s"
  - "production"
  - "kubernetes"
  - "logging"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
---

# DevOps Domain Model: Implementation Guide

## Overview

This guide shows how to impose a unified domain model on distributed DevOps infrastructure (Git, Docker, Kubernetes, CI/CD, logs) for consolidated visibility and consistency checking.

## Why This Approach Works for DevOps

✅ **Distributed by nature** - Git, Docker, K8s should remain independent
✅ **Read-mostly** - We're correlating, not enforcing
✅ **Eventual consistency acceptable** - Minutes of lag is fine
✅ **Post-hoc analysis valuable** - Understanding deployment history is critical
✅ **No overarching system needed** - Correlation via metadata

---

## Step 1: Define Correlation Identifiers

These are your "foreign keys" across systems:

### Primary Correlation Keys

| Identifier | Format | Used In | Purpose |
|------------|--------|---------|---------|
| **commitHash** | `sha256:abc123...` | Git, CI, Docker metadata, K8s annotations | Primary traceability key |
| **imageDigest** | `sha256:def456...` | Docker registry, K8s pod specs | Container identity |
| **buildId** | `build-2024-001` | CI system, Docker labels, K8s annotations | Build traceability |
| **deploymentId** | `deploy-prod-2024-001` | K8s deployment, logs, metrics | Deployment tracking |
| **version/tag** | `v1.2.3` or `main-abc123` | Git tags, Docker tags, K8s labels | Human-readable reference |

### Secondary Correlation Keys

| Identifier | Purpose | Example |
|------------|---------|---------|
| **buildNumber** | CI pipeline tracking | `#1234` |
| **prNumber** | Pull request linking | `PR-456` |
| **releaseVersion** | Semantic versioning | `v2.1.0` |
| **environmentName** | Deployment target | `production`, `staging` |

---

## Step 2: Metadata Injection Strategy

### Git (Source of Truth)

**Already has:**
- ✅ commitHash
- ✅ author, timestamp, message
- ✅ branch name

**Add via git tags:**
```bash
# Tag commit with build info
git tag -a "build-${BUILD_ID}" -m "Build: ${BUILD_NUMBER}, CI: ${CI_JOB_URL}"

# Tag with deployment info
git tag -a "deploy-prod-${DEPLOY_ID}" -m "Deployed to prod at $(date)"
```

**Add via commit messages (structured):**
```
feat: Add user authentication

build-id: build-2024-001
jira: PROJ-123
reviewed-by: alice@example.com
```

### Docker Images (Container Layer)

**Inject metadata as OCI labels:**

```dockerfile
# In Dockerfile or at build time
LABEL org.opencontainers.image.source="https://github.com/myorg/myrepo"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

# Custom domain labels
LABEL com.myorg.build.id="${BUILD_ID}"
LABEL com.myorg.build.number="${BUILD_NUMBER}"
LABEL com.myorg.build.url="${CI_JOB_URL}"
LABEL com.myorg.build.branch="${GIT_BRANCH}"
LABEL com.myorg.test.passed="${TEST_STATUS}"
LABEL com.myorg.security.scan="${SCAN_ID}"
```

**At build time:**
```bash
docker build \
  --label "org.opencontainers.image.revision=${GIT_COMMIT}" \
  --label "com.myorg.build.id=${BUILD_ID}" \
  --label "com.myorg.build.timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -t myapp:${VERSION} .
```

**Query labels:**
```bash
docker inspect myapp:latest --format='{{json .Config.Labels}}'
```

### Kubernetes (Runtime Layer)

**Inject metadata as annotations and labels:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
    version: v1.2.3
    environment: production
  annotations:
    # Source traceability
    git.commit: "abc123def456"
    git.branch: "main"
    git.repo: "https://github.com/myorg/myrepo"
    
    # Build traceability
    build.id: "build-2024-001"
    build.number: "1234"
    build.url: "https://ci.example.com/job/1234"
    build.timestamp: "2024-01-15T10:30:00Z"
    
    # Deployment traceability
    deployment.id: "deploy-prod-2024-001"
    deployment.timestamp: "2024-01-15T14:00:00Z"
    deployment.operator: "alice@example.com"
    deployment.change-request: "CHG-5678"
    
    # Container traceability
    image.digest: "sha256:def456..."
    image.scan.id: "scan-2024-001"
    image.scan.status: "passed"

spec:
  template:
    metadata:
      labels:
        app: myapp
        version: v1.2.3
      annotations:
        # Propagate to pods
        git.commit: "abc123def456"
        deployment.id: "deploy-prod-2024-001"
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp@sha256:def456...  # Use digest!
        env:
        - name: GIT_COMMIT
          value: "abc123def456"
        - name: BUILD_ID
          value: "build-2024-001"
        - name: DEPLOYMENT_ID
          value: "deploy-prod-2024-001"
```

**Add to pods at runtime:**
```bash
kubectl annotate deployment myapp \
  git.commit="${GIT_COMMIT}" \
  deployment.id="${DEPLOY_ID}" \
  --overwrite
```

### Application Logs (Observability Layer)

**Structure logs with correlation fields:**

```json
{
  "timestamp": "2024-01-15T14:05:23Z",
  "level": "INFO",
  "message": "User authentication successful",
  "correlation": {
    "git_commit": "abc123def456",
    "build_id": "build-2024-001",
    "deployment_id": "deploy-prod-2024-001",
    "pod_name": "myapp-7d8f9-xyz",
    "container_id": "docker://123abc",
    "node_name": "node-01"
  },
  "context": {
    "user_id": "user-123",
    "trace_id": "trace-abc-def",
    "span_id": "span-123"
  }
}
```

**In application code:**
```python
import os
import logging

# Read correlation IDs from environment
GIT_COMMIT = os.getenv('GIT_COMMIT', 'unknown')
BUILD_ID = os.getenv('BUILD_ID', 'unknown')
DEPLOYMENT_ID = os.getenv('DEPLOYMENT_ID', 'unknown')
POD_NAME = os.getenv('HOSTNAME', 'unknown')

# Configure structured logging
logging.basicConfig(
    format='%(message)s',
    level=logging.INFO
)

class CorrelationLogger:
    def info(self, message, **context):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "message": message,
            "correlation": {
                "git_commit": GIT_COMMIT,
                "build_id": BUILD_ID,
                "deployment_id": DEPLOYMENT_ID,
                "pod_name": POD_NAME,
            },
            "context": context
        }
        logging.info(json.dumps(log_entry))

logger = CorrelationLogger()
logger.info("Request processed", user_id="123", duration_ms=45)
```

---

## Step 3: Data Collection Strategy

You need to extract metadata from each system without building a monolithic monitor.

### Collection Architecture

```
┌─────────────┐
│   Git API   │ → Collector → JSON files
└─────────────┘

┌─────────────┐
│ Docker API  │ → Collector → JSON files
└─────────────┘

┌─────────────┐
│ K8s API     │ → Collector → JSON files
└─────────────┘

┌─────────────┐
│  Logs API   │ → Collector → JSON files
└─────────────┘

         ↓
    [Correlation Engine]
         ↓
    [Consistency Checker]
         ↓
    [Reports / Dashboards]
```

### Simple Collector Pattern

Each collector:
1. Queries its source system API
2. Extracts objects and metadata
3. Writes to standardized JSON format
4. Stores with timestamp

**Example: Git Collector**
```python
# git_collector.py
import git
import json
from datetime import datetime

def collect_git_metadata(repo_path, output_dir):
    repo = git.Repo(repo_path)
    
    commits = []
    for commit in repo.iter_commits(max_count=100):
        commits.append({
            "type": "Commit",
            "commitHash": commit.hexsha,
            "shortHash": commit.hexsha[:7],
            "author": str(commit.author),
            "timestamp": commit.committed_datetime.isoformat(),
            "message": commit.message.strip(),
            "branch": repo.active_branch.name,
            "tags": [tag.name for tag in repo.tags if tag.commit == commit],
            "parents": [p.hexsha for p in commit.parents]
        })
    
    output = {
        "collectedAt": datetime.utcnow().isoformat(),
        "source": "git",
        "repository": repo.remotes.origin.url,
        "commits": commits
    }
    
    with open(f"{output_dir}/git-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json", 'w') as f:
        json.dump(output, f, indent=2)

if __name__ == "__main__":
    collect_git_metadata("/path/to/repo", "./data/git")
```

**Example: Docker Collector**
```python
# docker_collector.py
import docker
import json
from datetime import datetime

def collect_docker_metadata(registry_url, image_names, output_dir):
    client = docker.from_env()
    
    images = []
    for image_name in image_names:
        try:
            image = client.images.get(image_name)
            
            images.append({
                "type": "ContainerImage",
                "imageId": image.id,
                "tags": image.tags,
                "digest": image.attrs.get('RepoDigests', ['unknown'])[0],
                "created": image.attrs['Created'],
                "size": image.attrs['Size'],
                "labels": image.labels,
                "metadata": {
                    "gitCommit": image.labels.get('org.opencontainers.image.revision'),
                    "buildId": image.labels.get('com.myorg.build.id'),
                    "buildNumber": image.labels.get('com.myorg.build.number'),
                    "version": image.labels.get('org.opencontainers.image.version'),
                }
            })
        except docker.errors.ImageNotFound:
            continue
    
    output = {
        "collectedAt": datetime.utcnow().isoformat(),
        "source": "docker",
        "registry": registry_url,
        "images": images
    }
    
    with open(f"{output_dir}/docker-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json", 'w') as f:
        json.dump(output, f, indent=2)

if __name__ == "__main__":
    collect_docker_metadata(
        "myregistry.io",
        ["myapp:latest", "myapp:v1.2.3"],
        "./data/docker"
    )
```

**Example: Kubernetes Collector**
```python
# k8s_collector.py
from kubernetes import client, config
import json
from datetime import datetime

def collect_k8s_metadata(namespace, output_dir):
    config.load_kube_config()
    
    apps_v1 = client.AppsV1Api()
    core_v1 = client.CoreV1Api()
    
    deployments = []
    for deploy in apps_v1.list_namespaced_deployment(namespace).items:
        deployments.append({
            "type": "Deployment",
            "deploymentId": f"{namespace}-{deploy.metadata.name}",
            "name": deploy.metadata.name,
            "namespace": deploy.metadata.namespace,
            "labels": deploy.metadata.labels,
            "annotations": deploy.metadata.annotations,
            "replicas": deploy.spec.replicas,
            "image": deploy.spec.template.spec.containers[0].image,
            "createdAt": deploy.metadata.creation_timestamp.isoformat(),
            "metadata": {
                "gitCommit": deploy.metadata.annotations.get('git.commit') if deploy.metadata.annotations else None,
                "buildId": deploy.metadata.annotations.get('build.id') if deploy.metadata.annotations else None,
                "deploymentId": deploy.metadata.annotations.get('deployment.id') if deploy.metadata.annotations else None,
            }
        })
    
    pods = []
    for pod in core_v1.list_namespaced_pod(namespace).items:
        pods.append({
            "type": "Pod",
            "podId": pod.metadata.name,
            "namespace": pod.metadata.namespace,
            "nodeName": pod.spec.node_name,
            "status": pod.status.phase,
            "startedAt": pod.status.start_time.isoformat() if pod.status.start_time else None,
            "labels": pod.metadata.labels,
            "annotations": pod.metadata.annotations,
            "containers": [
                {
                    "name": c.name,
                    "image": c.image,
                    "imageId": pod.status.container_statuses[i].image_id if pod.status.container_statuses else None,
                    "restartCount": pod.status.container_statuses[i].restart_count if pod.status.container_statuses else 0,
                }
                for i, c in enumerate(pod.spec.containers)
            ],
            "metadata": {
                "gitCommit": pod.metadata.annotations.get('git.commit') if pod.metadata.annotations else None,
                "deploymentId": pod.metadata.annotations.get('deployment.id') if pod.metadata.annotations else None,
            }
        })
    
    output = {
        "collectedAt": datetime.utcnow().isoformat(),
        "source": "kubernetes",
        "cluster": "production",
        "namespace": namespace,
        "deployments": deployments,
        "pods": pods
    }
    
    with open(f"{output_dir}/k8s-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json", 'w') as f:
        json.dump(output, f, indent=2)

if __name__ == "__main__":
    collect_k8s_metadata("production", "./data/k8s")
```

---

## Step 4: Correlation Engine

Now build correlation logic to link objects across systems:

```python
# correlation_engine.py
import json
import glob
from collections import defaultdict

class CorrelationEngine:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.commits = {}
        self.builds = {}
        self.images = {}
        self.deployments = {}
        self.pods = {}
        
    def load_all_data(self):
        """Load all collected JSON files"""
        # Load Git data
        for file in glob.glob(f"{self.data_dir}/git/*.json"):
            with open(file) as f:
                data = json.load(f)
                for commit in data.get('commits', []):
                    self.commits[commit['commitHash']] = commit
        
        # Load Docker data
        for file in glob.glob(f"{self.data_dir}/docker/*.json"):
            with open(file) as f:
                data = json.load(f)
                for image in data.get('images', []):
                    digest = image.get('digest', 'unknown')
                    self.images[digest] = image
        
        # Load K8s data
        for file in glob.glob(f"{self.data_dir}/k8s/*.json"):
            with open(file) as f:
                data = json.load(f)
                for deploy in data.get('deployments', []):
                    self.deployments[deploy['deploymentId']] = deploy
                for pod in data.get('pods', []):
                    self.pods[pod['podId']] = pod
    
    def correlate_deployment_to_commit(self, deployment_id):
        """Find the git commit for a deployment"""
        deployment = self.deployments.get(deployment_id)
        if not deployment:
            return None
        
        # Try annotation first
        commit_hash = deployment.get('metadata', {}).get('gitCommit')
        if commit_hash and commit_hash in self.commits:
            return self.commits[commit_hash]
        
        # Try image labels
        image = deployment.get('image')
        for img_digest, img_data in self.images.items():
            if image in img_data.get('tags', []):
                commit_hash = img_data.get('metadata', {}).get('gitCommit')
                if commit_hash and commit_hash in self.commits:
                    return self.commits[commit_hash]
        
        return None
    
    def correlate_pod_to_commit(self, pod_id):
        """Find the git commit for a running pod"""
        pod = self.pods.get(pod_id)
        if not pod:
            return None
        
        # Try annotation
        commit_hash = pod.get('metadata', {}).get('gitCommit')
        if commit_hash:
            return self.commits.get(commit_hash)
        
        # Try image digest
        for container in pod.get('containers', []):
            image_id = container.get('imageId', '')
            # Extract digest from image_id (format: docker-pullable://repo@sha256:...)
            if '@sha256:' in image_id:
                digest = 'sha256:' + image_id.split('@sha256:')[1].split('@')[0]
                image = self.images.get(digest)
                if image:
                    commit_hash = image.get('metadata', {}).get('gitCommit')
                    if commit_hash:
                        return self.commits.get(commit_hash)
        
        return None
    
    def build_traceability_chain(self, starting_point, starting_type):
        """Build complete traceability from any starting point"""
        chain = {
            "commit": None,
            "build": None,
            "image": None,
            "deployment": None,
            "pods": []
        }
        
        if starting_type == "commit":
            commit_hash = starting_point
            chain["commit"] = self.commits.get(commit_hash)
            
            # Find images with this commit
            for digest, image in self.images.items():
                if image.get('metadata', {}).get('gitCommit') == commit_hash:
                    chain["image"] = image
                    
                    # Find deployments with this image
                    for deploy_id, deploy in self.deployments.items():
                        if digest in deploy.get('image', ''):
                            chain["deployment"] = deploy
                            
                            # Find pods from this deployment
                            deploy_name = deploy.get('name')
                            for pod_id, pod in self.pods.items():
                                if pod.get('labels', {}).get('app') == deploy_name:
                                    chain["pods"].append(pod)
                    break
        
        # Similar logic for other starting_types...
        
        return chain
    
    def generate_report(self):
        """Generate correlation report"""
        report = {
            "summary": {
                "total_commits": len(self.commits),
                "total_images": len(self.images),
                "total_deployments": len(self.deployments),
                "total_pods": len(self.pods),
            },
            "correlations": [],
            "orphans": {
                "images_without_commit": [],
                "deployments_without_commit": [],
                "pods_without_correlation": []
            }
        }
        
        # Check for orphaned images
        for digest, image in self.images.items():
            commit = image.get('metadata', {}).get('gitCommit')
            if not commit or commit not in self.commits:
                report["orphans"]["images_without_commit"].append({
                    "digest": digest,
                    "tags": image.get('tags', [])
                })
        
        # Check for orphaned deployments
        for deploy_id, deploy in self.deployments.items():
            commit = self.correlate_deployment_to_commit(deploy_id)
            if not commit:
                report["orphans"]["deployments_without_commit"].append({
                    "deploymentId": deploy_id,
                    "name": deploy.get('name'),
                    "image": deploy.get('image')
                })
        
        return report

if __name__ == "__main__":
    engine = CorrelationEngine("./data")
    engine.load_all_data()
    
    report = engine.generate_report()
    print(json.dumps(report, indent=2))
```

---

## Step 5: Consistency Checks

Define business rules and check them:

```python
# consistency_checker.py
from correlation_engine import CorrelationEngine

class ConsistencyChecker:
    def __init__(self, engine):
        self.engine = engine
        self.violations = []
    
    def check_all(self):
        """Run all consistency checks"""
        self.check_all_deployments_have_commit()
        self.check_all_images_scanned()
        self.check_all_pods_from_known_images()
        self.check_deployment_matches_pods()
        return self.violations
    
    def check_all_deployments_have_commit(self):
        """Rule: Every deployment must be traceable to a git commit"""
        for deploy_id, deploy in self.engine.deployments.items():
            commit = self.engine.correlate_deployment_to_commit(deploy_id)
            if not commit:
                self.violations.append({
                    "rule": "deployment_has_commit",
                    "severity": "HIGH",
                    "deploymentId": deploy_id,
                    "deployment": deploy.get('name'),
                    "message": f"Deployment {deploy.get('name')} has no traceable git commit"
                })
    
    def check_all_images_scanned(self):
        """Rule: All images must have security scan"""
        for digest, image in self.engine.images.items():
            scan_status = image.get('labels', {}).get('com.myorg.security.scan')
            if not scan_status:
                self.violations.append({
                    "rule": "image_must_be_scanned",
                    "severity": "CRITICAL",
                    "imageDigest": digest,
                    "tags": image.get('tags', []),
                    "message": f"Image {image.get('tags', ['unknown'])[0]} has no security scan"
                })
    
    def check_all_pods_from_known_images(self):
        """Rule: All running pods must use images from our registry"""
        for pod_id, pod in self.engine.pods.items():
            for container in pod.get('containers', []):
                image = container.get('image', '')
                if not image.startswith('myregistry.io/'):
                    self.violations.append({
                        "rule": "pods_use_approved_registry",
                        "severity": "MEDIUM",
                        "podId": pod_id,
                        "image": image,
                        "message": f"Pod {pod_id} uses image from unapproved registry: {image}"
                    })
    
    def check_deployment_matches_pods(self):
        """Rule: Pod count should match deployment replica count"""
        for deploy_id, deploy in self.engine.deployments.items():
            expected_replicas = deploy.get('replicas', 1)
            deploy_name = deploy.get('name')
            
            # Count running pods for this deployment
            running_pods = [
                pod for pod in self.engine.pods.values()
                if pod.get('labels', {}).get('app') == deploy_name
                and pod.get('status') == 'Running'
            ]
            
            if len(running_pods) != expected_replicas:
                self.violations.append({
                    "rule": "deployment_replica_count",
                    "severity": "MEDIUM",
                    "deploymentId": deploy_id,
                    "expected": expected_replicas,
                    "actual": len(running_pods),
                    "message": f"Deployment {deploy_name} expects {expected_replicas} replicas but has {len(running_pods)}"
                })

if __name__ == "__main__":
    engine = CorrelationEngine("./data")
    engine.load_all_data()
    
    checker = ConsistencyChecker(engine)
    violations = checker.check_all()
    
    print(f"Found {len(violations)} violations:")
    for v in violations:
        print(f"  [{v['severity']}] {v['rule']}: {v['message']}")
```

---

## Step 6: Practical Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Define your domain model (adapt the one provided)
2. Choose correlation identifiers
3. Document metadata schema
4. Create simple collectors for Git, Docker, K8s

### Phase 2: Metadata Injection (Week 3-4)
1. Update CI/CD pipelines to add labels to Docker images
2. Update K8s deployment templates with annotations
3. Instrument application logging with correlation IDs
4. Test end-to-end traceability

### Phase 3: Correlation (Week 5-6)
1. Build correlation engine
2. Test correlation logic
3. Create initial reports

### Phase 4: Consistency Checking (Week 7-8)
1. Define business rules
2. Implement consistency checks
3. Create violation reports
4. Set up alerting

### Phase 5: Visualization (Week 9-10)
1. Build dashboards
2. Create traceability diagrams
3. Automate report generation

---

## Quick Win: Minimum Viable Implementation

Start here for immediate value:

```yaml
# Step 1: Add to CI/CD pipeline
docker build \
  --label "git.commit=$GIT_COMMIT" \
  --label "build.id=$CI_JOB_ID" \
  -t myapp:$VERSION .

# Step 2: Add to K8s deployment
kubectl annotate deployment myapp \
  git.commit="$GIT_COMMIT" \
  build.id="$CI_JOB_ID"

# Step 3: Query correlation
DEPLOY_COMMIT=$(kubectl get deployment myapp -o jsonpath='{.metadata.annotations.git\.commit}')
IMAGE=$(kubectl get deployment myapp -o jsonpath='{.spec.template.spec.containers[0].image}')
IMAGE_COMMIT=$(docker inspect $IMAGE --format='{{.Config.Labels.git\.commit}}')

if [ "$DEPLOY_COMMIT" == "$IMAGE_COMMIT" ]; then
  echo "✓ Deployment matches image"
else
  echo "✗ MISMATCH: Deploy=$DEPLOY_COMMIT, Image=$IMAGE_COMMIT"
fi
```

This gives you basic traceability in **one day**.

---

## Tools That Can Help

You don't need to build everything from scratch:

| Tool | Purpose | Use Case |
|------|---------|----------|
| **OpenTelemetry** | Distributed tracing | Correlation across services |
| **Prometheus + Grafana** | Metrics + visualization | Runtime monitoring |
| **Loki** | Log aggregation | Centralized logs with labels |
| **Jaeger** | Distributed tracing | Request flow tracking |
| **Kubernetes Dashboard** | K8s visualization | Deployment state |
| **Harbor** | Container registry | Image scanning, metadata |
| **ArgoCD** | GitOps | Git-to-K8s traceability |
| **Backstage** | Developer portal | Service catalog |

Many of these already support metadata propagation!

---

## Success Metrics

How do you know this is working?

1. **Traceability Coverage**
   - % of deployments traceable to commit: Target 95%+
   - % of images with build metadata: Target 100%
   - % of pods with correlation IDs: Target 90%+

2. **Consistency Compliance**
   - % of deployments passing all checks: Target 95%+
   - Mean time to detect violations: Target <5 minutes
   - % of violations with known remediation: Target 80%+

3. **Operational Impact**
   - Time to trace production issue to code: Target <5 minutes
   - % of incidents with complete audit trail: Target 95%+
   - Developer satisfaction with traceability: Survey

---

## Next Steps

1. Review and adapt the domain model
2. Choose your correlation identifiers
3. Implement metadata injection in one CI pipeline (proof of concept)
4. Build a simple collector for one system
5. Create one correlation query
6. Expand gradually

This is exactly the right approach for your scenario! Start small, prove value, then expand.
