---
title: "Fast-moving image Warehouse"
summary: "How Kargo Keeps Things in Sync: - Warehouses watch multiple repositories - When changes are detected, Freight bundles are created - Each Freight contains specific versions (commits, tags, digests) of all subscribed artifacts - This bundle is promoted as an atomic unit Key Difference from Unified Versioning: - Unified tags: Everything shares one version → simple but inflexible - Kargo Freight: Each artifact has its own version, bundled together → flexible but more complex My Recommendation: For your scenario (Helm charts, Dockerfiles, and code in separate repos), I'd suggest: 1. Start with unified tagging + Kargo (hybrid approach) to get the best of both 2. Use Freight creation criteria to ensure compatible combinations 3."
keywords:
  - "kargo"
  - "helm"
  - "yaml"
  - "container"
  - "deployment"
  - "orchestration"
  - "microservices"
  - "workflow"
category: "devplatform"
categoryName: "Development Platforms"
weight: 2
date: "2025-12-16"
draft: false
toc: true
---

## Prompt

If I have helm charts in one repository, dockerfiles in another, and application code spread across multiple repositories how does kargo keep them all in sync?  How does this differ from tagging all artifacts with a common release version?

## Response
Excellent question! This gets at the heart of how Kargo handles the complex reality of polyrepo architectures versus traditional release versioning. Let me search for specific information about Kargo's artifact tracking capabilities.Perfect! Now I have the detailed information needed. Let me provide a comprehensive answer.

## How Kargo Keeps Multi-Repo Artifacts in Sync

### **The Core Mechanism: Warehouses Create "Freight" Bundles**

A single Warehouse subscribes to repositories of all relevant artifacts, and each time it discovers a new revision of any or all of them, the Warehouse produces a new Freight resource referencing one revision of each. This is fundamentally different from traditional versioning.

**Here's the key insight:** Kargo treats a "release" as a **bundle of specific artifact versions** (a Freight object), not as a single version number applied to everything.

### **Example: Your Multi-Repo Scenario**

Let's say you have:
- **App Code Repo A**: Contains microservice-a → produces image `myapp/service-a:v1.2.3`
- **App Code Repo B**: Contains microservice-b → produces image `myapp/service-b:v2.1.0`
- **Helm Charts Repo**: Contains charts for both services
- **Dockerfiles Repo**: Contains build definitions

**Warehouse Configuration:**
```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata:
  name: my-app-warehouse
  namespace: my-project
spec:
  subscriptions:
    # Subscribe to container images (built from your code repos)
    - image:
        repoURL: myapp/service-a
        semverConstraint: ^1.0.0
    - image:
        repoURL: myapp/service-b
        semverConstraint: ^2.0.0
    # Subscribe to Helm chart repository
    - chart:
        repoURL: https://charts.example.com
        name: my-app-chart
        semverConstraint: ^0.5.0
    # Subscribe to configuration Git repo
    - git:
        repoURL: https://github.com/myorg/app-config.git
        branch: main
```

**What Happens:**
When something new is discovered in any repository to which a warehouse subscribes, the warehouse produces a new piece of freight.

**Resulting Freight might look like:**
```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Freight
metadata:
  name: freight-abc123
spec:
  warehouse: my-app-warehouse
  commits:
    - repoURL: https://github.com/myorg/app-config.git
      id: 7f4e8c2a9b1d3e5f6a8c9d0e1f2a3b4c5d6e7f8a
  images:
    - repoURL: myapp/service-a
      tag: v1.2.3
      digest: sha256:abcdef...
    - repoURL: myapp/service-b  
      tag: v2.1.0
      digest: sha256:123456...
  charts:
    - repoURL: https://charts.example.com
      name: my-app-chart
      version: 0.5.2
```

**This single Freight object now represents a testable, promotable unit** containing:
- Specific image digests (not just tags)
- Specific Git commit SHAs
- Specific Helm chart versions

Being referenced by a single Freight resource, these artifacts will be promoted from stage to stage together as a unit.

---

## **How This Differs from Common Release Versioning**

Let me break down the key differences:

### **Traditional Approach: Unified Version Tags**

**What you described:**
- Tag everything with `v1.5.0`
- service-a image: `v1.5.0`
- service-b image: `v1.5.0`  
- Helm chart: `v1.5.0`
- Git tag: `v1.5.0`

**Characteristics:**
✅ **Pros:**
- Simple mental model
- Easy to communicate ("deploy v1.5.0 to prod")
- Clear version history

❌ **Cons:**
- **Tight coupling**: All components must be versioned together, even if only one changed
- **Build overhead**: Every release requires rebuilding/re-tagging all artifacts
- **Deployment inflexibility**: Can't promote just a config change or just one service update
- **Dependency on CI/CD**: Requires sophisticated CI orchestration to tag everything consistently
- **Hotfix complexity**: Patching one component requires a new unified version across all

### **Kargo Approach: Artifact Bundles (Freight)**

**What Kargo does:**
- Creates immutable bundles of specific artifact versions
- service-a: `v1.2.3` (sha256:abc...)
- service-b: `v2.1.0` (sha256:def...)
- chart: `v0.5.2`
- config: `commit 7f4e8c2`

**Characteristics:**
✅ **Pros:**
- **Independent versioning**: Each artifact maintains its own semantic version
- **Selective promotion**: Can promote config changes without rebuilding images
- **State-driven**: No need for CI to coordinate tags - Kargo discovers what exists
- **Immutable references**: Uses image digests, not just tags (tags can be overwritten)
- **Flexible cadences**: You can promote image revisions rapidly many times per day, while configuration changes are promoted more slowly with greater deliberation
- **No rebuild required**: Creating a new Freight doesn't require any new builds

❌ **Cons:**
- **Complexity**: Harder to communicate ("promote Freight abc123")
- **Learning curve**: Requires understanding Kargo's model
- **Potential incompatibilities**: Risk of bundling incompatible versions

---

## **The Compatibility Problem & Solutions**

### **The Race Condition Issue**

When there are multiple subscriptions, you may be subjected to race conditions when discovering an artifact in one subscription that is incompatible with the latest artifact in another subscription.

**Example Problem:**
1. CI pushes `frontend:v2.0.0`
2. Kargo discovers it immediately
3. Kargo creates Freight with `frontend:v2.0.0` + `backend:v1.5.0` (old version)
4. This combo is incompatible!
5. Later, `backend:v2.0.0` gets pushed, but Freight already exists

### **Kargo's Solutions:**

#### **Solution 1: Freight Creation Criteria (Newer Feature)**

Warehouses can now use expression-based criteria to control when automatic Freight creation occurs, solving the long-standing problem of Warehouses creating Freight with incompatible artifact combinations.

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata:
  name: my-warehouse
spec:
  freightCreationPolicy: Automatic
  freightCreationCriteria:
    # Only create Freight when frontend and backend tags match
    expression: |
      imageFrom('myapp/frontend').Tag == imageFrom('myapp/backend').Tag
  subscriptions:
    - image:
        repoURL: myapp/frontend
    - image:
        repoURL: myapp/backend
```

**Reasoning:** This ensures Freight is only created when both frontend and backend have matching version tags, preventing incompatible combinations.

#### **Solution 2: Multiple Warehouses (Different Cadences)**

Create separate Warehouse resources, with one subscribing to the container image repository and the other subscribing to a Git repository containing configuration, so each Stage effectively has two parallel pipelines.

```yaml
# Fast-moving image Warehouse
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata:
  name: images-warehouse
spec:
  subscriptions:
    - image:
        repoURL: myapp/service-a
    - image:
        repoURL: myapp/service-b

---
# Slow-moving config Warehouse  
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata:
  name: config-warehouse
spec:
  subscriptions:
    - git:
        repoURL: https://github.com/myorg/app-config.git
```

**Reasoning:** This allows you to promote images frequently while promoting configuration changes separately at a slower, more deliberate pace.

#### **Solution 3: Gatekeeper Stage**

Create an initial stage that only allows compatible Freight to proceed:

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata:
  name: compatibility-gate
spec:
  subscriptions:
    warehouse: my-warehouse
  verification:
    analysisTemplates:
      - name: compatibility-check
```

**Reasoning:** Test compatibility before allowing Freight to proceed to real environments.

---

## **When to Use Each Approach**

### **Use Traditional Unified Versioning When:**
- You have a true monolith or tightly coupled services
- All components genuinely need to change together
- Your team is small and coordination is easy
- Simplicity is more important than flexibility
- Marketing/external communication needs simple version numbers

### **Use Kargo's Freight-Based Approach When:**
- You have microservices or polyrepo architecture
- Different components change at different rates
- You want to decouple deployments from builds
- You need to promote config changes without rebuilding
- You want progressive delivery (canary, blue/green) with state tracking
- You need strong audit trails of what's deployed where

---

## **Hybrid Approach (Best of Both Worlds)**

You can actually combine both approaches:

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata:
  name: release-warehouse
spec:
  freightCreationPolicy: Automatic
  freightCreationCriteria:
    # Only create Freight when all artifacts have the same semver tag
    expression: |
      imageFrom('myapp/frontend').Tag == 
      imageFrom('myapp/backend').Tag &&
      imageFrom('myapp/backend').Tag == 
      chartFrom('my-helm-chart').Version
  subscriptions:
    - image:
        repoURL: myapp/frontend
        allowTags: ^v\d+\.\d+\.\d+$  # Only semver tags
    - image:
        repoURL: myapp/backend
        allowTags: ^v\d+\.\d+\.\d+$
    - chart:
        repoURL: https://charts.example.com
        name: my-app-chart
```

**Benefits:**
- Your CI still tags everything with unified versions (v1.5.0)
- Kargo only creates Freight when all components have matching versions
- You get Kargo's promotion workflow and state tracking
- You get the simplicity of unified version communication

---

## **Summary & Recommendation**

**How Kargo Keeps Things in Sync:**
- Warehouses watch multiple repositories
- When changes are detected, Freight bundles are created
- Each Freight contains specific versions (commits, tags, digests) of all subscribed artifacts
- This bundle is promoted as an atomic unit

**Key Difference from Unified Versioning:**
- **Unified tags**: Everything shares one version → simple but inflexible
- **Kargo Freight**: Each artifact has its own version, bundled together → flexible but more complex

**My Recommendation:**
For your scenario (Helm charts, Dockerfiles, and code in separate repos), I'd suggest:

1. **Start with unified tagging + Kargo** (hybrid approach) to get the best of both
2. Use Freight creation criteria to ensure compatible combinations
3. As your team matures, consider splitting into multiple Warehouses for different promotion cadences
4. Always use image digests in Freight (which Kargo does automatically) for immutability

**Does this clarify the difference? Would you like me to dive deeper into any specific aspect or show you a complete working example for your specific repository structure?**
