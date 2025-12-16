# Kargo and ArgoCD: A Comprehensive Guide

## Executive Summary

This document provides a comprehensive overview of Kargo and ArgoCD, two complementary tools in the GitOps ecosystem. While ArgoCD excels at continuous deployment by syncing Kubernetes clusters to desired states stored in Git repositories, it lacks built-in promotion workflows between environments. Kargo fills this gap by orchestrating progressive rollouts across multiple stages (dev, staging, production) while maintaining GitOps principles.

---

## Overview

### ArgoCD: Continuous Deployment

**ArgoCD** is a declarative, GitOps continuous delivery tool for Kubernetes. It continuously monitors Git repositories and ensures that the actual state of your Kubernetes cluster matches the desired state declared in Git.

**Core Capabilities:**
- Syncs Kubernetes clusters to Git repository states
- Supports multiple configuration management tools (Kustomize, Helm, Jsonnet, plain YAML)
- Provides automated deployment with rollback capabilities
- Offers application health monitoring and visualization
- Enables automated or manual sync policies

**What ArgoCD Does Well:**
- Deploying applications to Kubernetes clusters
- Maintaining desired state from Git
- Detecting configuration drift
- Providing deployment visualization

**What ArgoCD Doesn't Provide:**
- No concept of "promotion" between environments
- No orchestration of changes from dev → staging → production
- No built-in artifact version tracking across stages
- No progressive delivery workflows

### Kargo: Continuous Promotion

**Kargo** is a continuous promotion platform that orchestrates the lifecycle of applications across multiple stages using GitOps principles. Built by the creators of Argo, Kargo automates progressive rollouts while integrating seamlessly with ArgoCD.

**Core Capabilities:**
- Multi-stage promotion orchestration (dev → staging → production)
- Artifact tracking across environments (container images, Helm charts, Git commits)
- State-driven promotion without relying on CI pipelines
- Integration with ArgoCD for deployment execution
- Audit trails and promotion history

**The Complementary Relationship:**
- **ArgoCD** = The deployment engine (handles the "how" of deploying)
- **Kargo** = The promotion orchestrator (handles the "when" and "what" gets promoted)

---

## Core Concepts

### 1. Kargo Fundamental Concepts

#### Warehouses

Warehouses are the source of Freight. They monitor repositories (container registries, Git repositories, Helm chart repositories) for new artifact versions. When new artifacts are discovered, Warehouses produce Freight.

**Key Characteristics:**
- Subscribe to one or more repositories
- Discover new artifact versions automatically or on-demand
- Apply version constraints (semver, lexical, newest)
- Can be configured for automatic or manual Freight creation
- Support webhook triggers for immediate discovery

#### Freight

Freight represents a bundle of specific artifact versions that move through your promotion pipeline as a unit. Think of Freight as a "meta-artifact" or a shipping container that holds multiple artifacts together.

**What Freight Contains:**
- Specific container image versions (with digests, not just tags)
- Specific Git commit SHAs
- Specific Helm chart versions
- Any combination of the above

**Key Characteristics:**
- Immutable once created (except alias and status fields)
- Has a unique SHA-1 hash identifier
- Has a human-friendly alias (e.g., "brave-eagle")
- References artifacts by immutable identifiers (image digests, commit SHAs)
- Promoted as an atomic unit across stages

**Critical Insight:** Freight is NOT a single version number applied to everything. Instead, it's a tested, verified combination of specific artifact versions.

#### Stages

Stages represent promotion targets in your application lifecycle. While stages often correspond to environments (dev, staging, production), they technically represent any desired state that needs to be altered through promotion.

**Key Characteristics:**
- Define what Freight they accept (from Warehouses or upstream Stages)
- Specify how to promote Freight (promotion mechanisms)
- Can be configured for automatic or manual promotion
- Track health status of deployed applications
- Form pipelines by subscribing to upstream Stages

#### Promotions

Promotions are the execution of moving Freight into a Stage. A Promotion is a Kubernetes resource created when Freight is promoted to a Stage.

**What Happens During Promotion:**
1. Execute a series of discrete steps (git clone, update manifests, commit, push)
2. Update GitOps repository with new artifact versions
3. Trigger ArgoCD Application sync
4. Monitor deployment health
5. Mark Stage as verified upon success

**Promotion Mechanisms:**
- Git repository updates (modify Kustomize overlays, Helm values)
- ArgoCD Application updates (trigger syncs, update revisions)
- Custom scripts and workflows
- Pull request workflows

#### Projects

Projects are units of tenancy for organizing and managing promotion pipelines. Every Kargo Project is associated with a Kubernetes namespace, making it easy to manage access using standard Kubernetes RBAC.

### 2. How Kargo and ArgoCD Work Together

#### The Integration Model

Kargo and ArgoCD integrate through a **declarative, Kubernetes-native approach**. Kargo does NOT call ArgoCD's REST API; instead, it modifies ArgoCD Application Custom Resources directly via the Kubernetes API.

**Primary Interaction Methods:**

1. **Custom Resource Modification:** Kargo patches ArgoCD Application resources to update fields like `targetRevision` or trigger sync operations
2. **Status Monitoring:** Kargo continuously watches Application health and sync status
3. **Authorization via Annotations:** Applications explicitly authorize Stages to manage them

**Authorization Model:**

Applications must be annotated to grant Kargo permission:
```
kargo.akuity.io/authorized-stage: "<project-name>:<stage-name>"
```

This annotation-based delegation ensures that only authorized Stages can modify specific Applications. Since the annotation can only be added by someone authorized to update the Application, Kargo interprets it as explicit permission.

#### Typical Promotion Workflow

1. **Artifact Discovery:** Warehouse detects new container image in registry
2. **Freight Creation:** Warehouse creates Freight referencing the new image version
3. **Git Update:** Developer approves promotion; Kargo updates GitOps repository
4. **Application Patch:** Kargo patches ArgoCD Application's targetRevision field
5. **ArgoCD Sync:** ArgoCD detects change and syncs cluster to new state
6. **Health Monitoring:** Kargo monitors Application health
7. **Stage Verification:** Once healthy, Freight is marked as verified for next Stage
8. **Progressive Promotion:** Verified Freight can be promoted to subsequent Stages

**Key Insight:** ArgoCD focuses on deployment mechanics (syncing Git to cluster), while Kargo handles promotion logic (orchestrating what gets deployed when).

### 3. Multi-Repository Artifact Management

#### The Challenge

In modern microservices architectures, applications often have:
- Application code in multiple repositories
- Dockerfiles in a separate repository
- Helm charts in another repository
- Configuration spread across multiple locations

How does Kargo keep all these in sync?

#### Kargo's Solution: Freight Bundles

Kargo creates Freight bundles that reference specific versions of ALL artifacts from multiple repositories. A single Warehouse can subscribe to multiple repositories, and when it discovers new versions, it produces Freight containing one version of each artifact.

**Example Freight Bundle:**
- Frontend image: `myapp/frontend:v2.1.0` (digest: sha256:abc...)
- Backend image: `myapp/backend:v3.0.1` (digest: sha256:def...)
- Helm chart: `my-chart:v0.5.2`
- Config commit: `7f4e8c2a9b1d3e5f6a8c9d0e1f2a3b4c5d6e7f8a`

Being referenced by a single Freight resource, these artifacts are promoted from stage to stage together as a unit.

#### Comparison to Traditional Unified Versioning

**Traditional Approach (Unified Version Tags):**
- Tag everything with the same version (e.g., v1.5.0)
- Simple mental model and easy communication
- BUT: Tight coupling, requires rebuilding everything for any change
- BUT: Can't promote just a config change or single service update

**Kargo Approach (Freight Bundles):**
- Each artifact maintains its own version
- Bundled together as tested combinations
- Independent versioning with coordinated promotion
- Selective promotion capabilities

**Key Trade-offs:**
- Unified versioning: Simple but inflexible
- Kargo bundles: Flexible but more complex

#### Handling Incompatible Combinations

**The Race Condition Problem:**

When Warehouses subscribe to multiple repositories, there's a risk of creating incompatible Freight:
1. CI pushes `frontend:v2.0.0`
2. Kargo discovers it immediately
3. Kargo creates Freight with `frontend:v2.0.0` + `backend:v1.5.0` (old)
4. This combination is incompatible
5. Later `backend:v2.0.0` arrives, but Freight already exists

**Solutions:**

1. **Freight Creation Criteria:** Use expressions to ensure only compatible combinations create Freight
2. **Multiple Warehouses:** Separate fast-moving artifacts (images) from slow-moving ones (config)
3. **Manual Freight Assembly:** Disable automatic creation and manually select compatible versions
4. **Gatekeeper Stage:** Create initial stage where failures are acceptable, filtering bad combinations

### 4. Combining and Manipulating Freight

#### Can You Combine Freight After Creation?

**Short Answer:** No direct merging, but several approaches achieve similar outcomes.

**Why No Direct Merging:**
- Freight is immutable by design (for audit trails and reproducibility)
- Merging would break the clean Warehouse → Freight → Stage lineage
- Could create untested combinations that bypass verification

**Available Approaches:**

1. **Manual Freight Assembly:** Configure Warehouse to discover multiple versions but not auto-create Freight; manually select which versions to bundle

2. **Freight Cloning:** Use existing Freight as a template, replacing only specific artifacts (useful for hotfixes)

3. **Multiple Warehouses with Stage-Level Combination:** Different Warehouses track different artifact types; Stages request Freight from multiple Warehouses and combine during promotion

4. **Freight Creation Criteria:** Define expressions that control when automatic Freight creation occurs

**Use Cases:**
- **Hotfixes:** Clone production Freight, replace one buggy component
- **Testing:** Create "what-if" combinations without new builds
- **Different Cadences:** Promote images frequently, config changes rarely

### 5. External Release Tracking

#### The Challenge

While Kargo provides excellent internal tracking through Freight objects and Git commits, organizations often need to track releases in external systems or create unified version numbers for communication purposes.

#### Creating Tags for External Tracking

Kargo doesn't automatically create Git tags for component combinations, but you can implement custom tagging in promotion workflows.

**Approaches:**

1. **Git Tags in Promotion Process:** Use bash steps to create annotated tags containing all component versions

2. **Release Manifest Files:** Create versioned YAML/JSON files in Git documenting exact component versions for each release

3. **Freight Metadata:** Attach metadata to Freight resources using the set-metadata promotion step

4. **External System Integration:** Send release information to external tracking systems via HTTP calls or notifications

**Benefits of Hybrid Approach:**
- Kargo tracks components internally (Freight + commits)
- Git tags provide external visibility
- Release manifests enable programmatic access
- External systems can query Git without Kargo access

**Trade-offs:**
- Internal tracking (Freight): Rich, immutable, tied to promotion workflow
- External tags: Simple, universally accessible, but requires custom implementation

### 6. Promotion Templates and Tasks

#### Promotion Templates

Promotion Templates define how Kargo transitions Freight into a Stage by executing a series of discrete, composable steps. Each Stage has a promotion template that specifies exactly what actions to take when Freight is promoted.

**Common Promotion Steps:**
- **git-clone:** Clone Git repository and checkout specific commits/branches
- **git-clear:** Clear working directory contents
- **yaml-update:** Update YAML file values (image tags, versions)
- **kustomize-set-image:** Update Kustomize image references
- **helm-update-image:** Update Helm values files
- **git-commit:** Commit all changes to working tree
- **git-push:** Push commits to remote repository
- **argocd-update:** Update ArgoCD Applications and trigger syncs

#### Promotion Tasks

Promotion Tasks are reusable sets of promotion steps that can be shared across multiple Stages or Projects. They come in two forms:
- **PromotionTask:** Project-scoped, available within a single Project
- **ClusterPromotionTask:** Cluster-scoped, available across all Projects

**Benefits:**
- Standardize common workflows
- Reduce duplication
- Centralize best practices
- Enable organizational patterns

### 7. Warehouse Configuration Patterns

#### Subscription Types

Warehouses can subscribe to:
- **Container Image Repositories:** Monitor for new image tags
- **Git Repositories:** Monitor for new commits or tags
- **Helm Chart Repositories:** Monitor for new chart versions

#### Selection Strategies

Different strategies for selecting which artifacts to track:

**For Git Repositories:**
- **NewestFromBranch:** Latest commit from specified branch
- **SemVer:** Commit referenced by tag matching semantic versioning constraint
- **Lexical:** Latest tag by lexical ordering

**For Container Images:**
- **SemVer:** Images with semantic version tags
- **Lexical:** Latest by lexical tag ordering
- **NewestBuild:** Most recently built image

#### Freight Creation Policies

**Automatic:** Warehouse creates Freight whenever new artifacts are discovered (default)

**Manual:** Warehouse discovers artifacts but doesn't create Freight; user manually selects versions

**Automatic with Criteria:** Warehouse creates Freight only when expression evaluates to true (prevents incompatible combinations)

### 8. Progressive Delivery Patterns

#### Common Case Pattern

Single Warehouse subscribes to both image repository and Git repository. Each discovery produces Freight with both an image version and config commit. Artifacts promoted together as a unit through all stages.

**Use Case:** Most standard applications where image and config should stay coordinated.

#### Grouped Services Pattern

Single Warehouse subscribes to multiple service image repositories. All services promoted together as a tightly-coupled unit.

**Use Case:** Microservices that have strong interdependencies and must be deployed together.

#### Independent Pipelines Pattern

Multiple Warehouses track different artifact types. Each produces Freight independently, creating parallel promotion pipelines through the same Stages.

**Use Case:** Promote images rapidly (multiple times daily) while promoting config changes slowly and deliberately.

#### Gatekeeper Stage Pattern

Initial Stage allows failures to filter out bad Freight combinations before they reach important environments.

**Use Case:** Prevent incompatible artifact combinations from progressing through pipeline.

### 9. Verification and Health Monitoring

#### Stage Health

Stage health is determined by multiple factors:
- Health of ArgoCD Applications managed by the Stage
- Verification checks configured on the Stage
- Promotion completion status
- Custom health indicators

**Key Insight:** Stage health is NOT just Application health. It encompasses all health checks registered during promotion, including custom verification.

#### Health Check Registration

When the argocd-update step completes successfully, it registers health checks that continuously monitor the Application. This enables Kargo to factor ArgoCD Application health into Stage health without requiring Kargo to understand Application health directly.

#### Verification

Stages can define verification processes that must pass before Freight is considered verified:
- Argo Rollouts AnalysisRun resources
- Kubernetes Jobs for custom tests
- External validation systems

### 10. Storage and Branch Strategies

#### Stage-Specific Branches

Kargo commonly uses stage-specific branches in GitOps repositories:
- `stage/dev` contains rendered manifests for dev environment
- `stage/staging` contains rendered manifests for staging
- `stage/production` contains rendered manifests for production

**Benefits:**
- Clear separation of environment states
- Easy rollback (checkout previous commit on branch)
- Complete history per environment
- No merge conflicts between environments

**Important:** These are NOT Git Flow branches requiring merging. Each branch is independent storage for rendered state.

#### Single Branch with Paths

Alternative approach uses single branch (main/trunk) with different paths:
- `builds/dev/` contains dev manifests
- `builds/staging/` contains staging manifests
- `builds/production/` contains production manifests

**Key Requirement:** Warehouse must use path filters to avoid triggering new Freight from its own promotion outputs (creating feedback loops).

---

## Architectural Principles

### GitOps Compliance

Both Kargo and ArgoCD adhere to GitOps principles:
- **Declarative:** Desired state defined declaratively
- **Versioned:** All state stored in Git with full history
- **Immutable:** Freight and commits are immutable
- **Automated:** Changes automatically reconciled
- **Auditable:** Complete trail of who changed what when

### Separation of Concerns

**ArgoCD Responsibilities:**
- Monitor Git repositories for changes
- Sync Kubernetes clusters to Git state
- Detect and remediate drift
- Report application health

**Kargo Responsibilities:**
- Track artifact versions across repositories
- Create Freight bundles of compatible versions
- Orchestrate promotion workflows
- Update Git repositories with new versions
- Coordinate ArgoCD syncs

**Neither Tool Requires the Other:**
- ArgoCD works without Kargo (manual promotions)
- Kargo can work with other CD tools (though optimized for ArgoCD)

### State-Driven vs. Event-Driven

**Traditional CI/CD:** Event-driven (push events trigger deployments)

**Kargo + ArgoCD:** State-driven (pull-based, continuous reconciliation)

**Benefits:**
- More reliable (no lost events)
- Self-healing (automatically recovers from failures)
- Auditable (current state always in Git)
- Predictable (deterministic outcomes)

### Multi-Tenancy

**Kargo Projects:**
- Map to Kubernetes namespaces
- Isolated with Kubernetes RBAC
- Can delegate authority via annotations
- Support for multiple projects per cluster

**ArgoCD Applications:**
- Can be namespaced for isolation
- Controlled by ArgoCD RBAC
- Kargo respects ArgoCD boundaries

---

## Best Practices

### 1. Repository Structure

**Recommended Approach:**
- Separate source code repositories from GitOps repositories
- Use GitOps repository exclusively for deployment manifests
- Structure GitOps repo with base configuration and environment-specific overlays
- Use Kustomize or Helm for configuration management

### 2. Freight Creation

**Guidelines:**
- Use automatic Freight creation with criteria for coordinated releases
- Use manual Freight assembly when compatibility is complex
- Implement gatekeeper Stages for filtering bad combinations
- Leverage Freight aliases for human-friendly identification

### 3. Promotion Workflows

**Recommendations:**
- Start with automatic promotions to dev/test
- Require manual approval for production
- Implement verification checks before allowing promotion
- Use stage-specific branches for clear separation
- Document promotion process in Promotion Tasks

### 4. Health and Verification

**Best Practices:**
- Configure appropriate health checks on ArgoCD Applications
- Implement automated verification where possible
- Use Argo Rollouts for progressive delivery patterns
- Monitor Stage health continuously
- Set realistic timeout values for verifications

### 5. Security and Access Control

**Guidelines:**
- Use Kubernetes RBAC for access control
- Leverage annotation-based authorization for delegation
- Restrict who can approve production promotions
- Audit promotion history regularly
- Use sealed secrets or external secret management

### 6. External Tracking

**Recommendations:**
- Implement Git tags for major releases to production
- Create release manifest files for programmatic access
- Use Freight metadata for runtime tracking
- Send notifications to external systems for visibility
- Maintain both internal (Freight) and external (tags) tracking

---

## Common Pitfalls and Solutions

### Pitfall 1: Freight with Incompatible Versions

**Problem:** Warehouse creates Freight with frontend:v2.0 + backend:v1.5 that are incompatible

**Solutions:**
- Use Freight creation criteria expressions
- Implement gatekeeper Stage
- Use manual Freight assembly
- Tag components with matching versions

### Pitfall 2: Feedback Loops

**Problem:** Warehouse triggers on its own promotion outputs, creating infinite loop

**Solution:** Use path filters (includePaths/excludePaths) to ignore promotion output directories

### Pitfall 3: Lost Freight Context

**Problem:** Can't determine which versions are in production outside Kargo

**Solutions:**
- Create Git tags during production promotions
- Generate release manifest files
- Send notifications to external tracking systems
- Use Freight metadata

### Pitfall 4: Slow Artifact Discovery

**Problem:** Warehouses take too long to discover new artifacts

**Solutions:**
- Configure webhooks for immediate discovery
- Adjust polling intervals
- Optimize image selection strategies
- Use discovery limits to reduce processing

### Pitfall 5: ArgoCD Application Not Syncing

**Problem:** ArgoCD doesn't sync after Kargo promotion

**Common Causes:**
- Missing authorization annotation
- Incorrect targetRevision format
- ArgoCD sync policy prevents auto-sync
- Application health checks failing

**Solutions:**
- Verify authorization annotation
- Check ArgoCD Application logs
- Ensure sync policy allows syncs
- Review Application health status

---

## Appendices

### Appendix A: Complete Warehouse Examples

#### A.1 Single Image Subscription

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata:
  name: nginx-warehouse
  namespace: my-project
spec:
  subscriptions:
    - image:
        repoURL: public.ecr.aws/nginx/nginx
        semverConstraint: ^1.26.0
        discoveryLimit: 5
```

**Explanation:**
- Monitors nginx image repository
- Only considers versions matching ^1.26.0 (1.26.x)
- Keeps last 5 discovered versions available
- Creates Freight automatically when new versions discovered

#### A.2 Multi-Repository Subscription with Criteria

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata:
  name: coordinated-release
  namespace: my-project
spec:
  freightCreationPolicy: Automatic
  freightCreationCriteria:
    expression: |
      imageFrom('myapp/frontend').Tag == 
      imageFrom('myapp/backend').Tag &&
      imageFrom('myapp/backend').Tag == 
      chartFrom('my-chart').Version
  subscriptions:
    - image:
        repoURL: myapp/frontend
        semverConstraint: ^2.0.0
    - image:
        repoURL: myapp/backend
        semverConstraint: ^2.0.0
    - chart:
        repoURL: https://charts.example.com
        name: my-chart
        semverConstraint: ^2.0.0
```

**Explanation:**
- Subscribes to two images and one Helm chart
- Only creates Freight when all three have matching version tags
- Prevents incompatible combinations
- Requires coordinated release versioning

#### A.3 Manual Freight Assembly Configuration

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata:
  name: manual-assembly
  namespace: my-project
spec:
  freightCreationPolicy: Manual
  subscriptions:
    - image:
        repoURL: myapp/frontend
        discoveryLimit: 10
    - image:
        repoURL: myapp/backend
        discoveryLimit: 10
    - git:
        repoURL: https://github.com/myorg/config.git
        commitSelectionStrategy: SemVer
```

**Explanation:**
- Discovers artifacts but doesn't auto-create Freight
- Keeps 10 versions of each image available
- User manually selects compatible combination via UI/CLI
- Ideal when compatibility rules are complex

#### A.4 Git Repository with Path Filters

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata:
  name: monorepo-app
  namespace: my-project
spec:
  subscriptions:
    - git:
        repoURL: https://github.com/myorg/monorepo.git
        commitSelectionStrategy: NewestFromBranch
        branch: main
        includePaths:
          - apps/my-service
        excludePaths:
          - apps/my-service/README.md
          - apps/my-service/docs
```

**Explanation:**
- Monitors only specific paths in monorepo
- Creates Freight only when changes affect my-service
- Excludes documentation changes
- Prevents unnecessary Freight creation

### Appendix B: Stage Configuration Examples

#### B.1 Development Stage with Auto-Promotion

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata:
  name: dev
  namespace: my-project
spec:
  # Subscribe to Warehouse
  requestedFreight:
    - origin:
        kind: Warehouse
        name: my-warehouse
      sources:
        direct: true
  
  # Auto-promote new Freight
  promotionTemplate:
    spec:
      vars:
        - name: gitopsRepo
          value: https://github.com/myorg/gitops.git
        - name: imageRepo
          value: myapp/service
      
      steps:
        # Clone GitOps repository
        - uses: git-clone
          config:
            repoURL: ${{ vars.gitopsRepo }}
            checkout:
              - branch: main
                path: ./src
              - branch: stage/dev
                create: true
                path: ./out
        
        # Clear output directory
        - uses: git-clear
          config:
            path: ./out
        
        # Update image in Kustomize
        - uses: kustomize-set-image
          as: update-image
          config:
            path: ./src/overlays/dev
            images:
              - image: ${{ vars.imageRepo }}
                tag: ${{ imageFrom(vars.imageRepo).Tag }}
        
        # Build Kustomize manifests
        - uses: kustomize-build
          config:
            path: ./src/overlays/dev
            outPath: ./out
        
        # Commit changes
        - uses: git-commit
          as: commit
          config:
            path: ./out
            message: |
              Updated dev to ${{ imageFrom(vars.imageRepo).Tag }}
              
              Image: ${{ vars.imageRepo }}:${{ imageFrom(vars.imageRepo).Tag }}
              Digest: ${{ imageFrom(vars.imageRepo).Digest }}
              Freight: ${{ ctx.freight.name }}
        
        # Push to stage branch
        - uses: git-push
          config:
            path: ./out
        
        # Update ArgoCD Application
        - uses: argocd-update
          config:
            apps:
              - name: myapp-dev
                namespace: argocd
                sources:
                  - repoURL: ${{ vars.gitopsRepo }}
                    desiredRevision: ${{ outputs.commit.commit }}
```

**Explanation:**
- Automatically promotes new Freight from Warehouse
- Clones GitOps repo to two paths (source and output)
- Updates image tag in Kustomize overlay
- Builds manifests and commits to stage/dev branch
- Triggers ArgoCD sync to new commit

#### B.2 Production Stage with Manual Approval

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata:
  name: production
  namespace: my-project
spec:
  # Subscribe to upstream staging Stage
  requestedFreight:
    - origin:
        kind: Warehouse
        name: my-warehouse
      sources:
        stages:
          - staging
  
  # Require manual promotion (no auto-promotion)
  promotionTemplate:
    spec:
      vars:
        - name: gitopsRepo
          value: https://github.com/myorg/gitops.git
        - name: releaseTag
          value: release-${{ timestamp("2006.01.02-150405") }}
      
      steps:
        # Standard promotion steps
        - uses: git-clone
          config:
            repoURL: ${{ vars.gitopsRepo }}
            checkout:
              - branch: main
                path: ./src
              - branch: stage/production
                create: true
                path: ./out
        
        - uses: git-clear
          config:
            path: ./out
        
        - uses: kustomize-set-image
          config:
            path: ./src/overlays/production
            images:
              - image: myapp/frontend
                tag: ${{ imageFrom('myapp/frontend').Tag }}
              - image: myapp/backend
                tag: ${{ imageFrom('myapp/backend').Tag }}
        
        - uses: kustomize-build
          config:
            path: ./src/overlays/production
            outPath: ./out
        
        - uses: git-commit
          as: commit
          config:
            path: ./out
            message: |
              Production Release ${{ vars.releaseTag }}
              
              Freight: ${{ ctx.freight.alias }}
              Frontend: ${{ imageFrom('myapp/frontend').Tag }}
              Backend: ${{ imageFrom('myapp/backend').Tag }}
        
        - uses: git-push
          config:
            path: ./out
        
        # Create release tag
        - uses: bash
          config:
            script: |
              #!/bin/bash
              cd ./out
              git tag -a "${{ vars.releaseTag }}" -m "Production Release
              
              Freight: ${{ ctx.freight.name }}
              Promoted: $(date -u +%Y-%m-%dT%H:%M:%SZ)
              
              Components:
              - Frontend: ${{ imageFrom('myapp/frontend').Tag }}
              - Backend: ${{ imageFrom('myapp/backend').Tag }}"
              
              git push origin "${{ vars.releaseTag }}"
        
        - uses: argocd-update
          config:
            apps:
              - name: myapp-production
                namespace: argocd
```

**Explanation:**
- Only promotes Freight verified in staging
- Requires manual trigger (no auto-promotion)
- Updates multiple images
- Creates Git tag for release tracking
- Provides external visibility via tags

#### B.3 Stage Using Multiple Warehouses

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata:
  name: staging
  namespace: my-project
spec:
  # Request Freight from two different Warehouses
  requestedFreight:
    - origin:
        kind: Warehouse
        name: app-images
      sources:
        direct: true
    - origin:
        kind: Warehouse
        name: infrastructure-config
      sources:
        direct: true
  
  promotionTemplate:
    spec:
      vars:
        - name: gitopsRepo
          value: https://github.com/myorg/gitops.git
      
      steps:
        - uses: git-clone
          config:
            repoURL: ${{ vars.gitopsRepo }}
            checkout:
              # Checkout from both Warehouses' subscribed repos
              - commit: ${{ commitFrom('github.com/myorg/helm-charts').ID }}
                path: ./charts
              - branch: stage/staging
                create: true
                path: ./out
        
        - uses: git-clear
          config:
            path: ./out
        
        # Update with images from first Warehouse
        - uses: helm-update-image
          config:
            path: ./charts/values.yaml
            images:
              - image: myapp/frontend
                key: frontend.image.tag
                value: ${{ imageFrom('myapp/frontend').Tag }}
              - image: myapp/backend
                key: backend.image.tag
                value: ${{ imageFrom('myapp/backend').Tag }}
        
        # Template Helm chart
        - uses: helm-template
          config:
            path: ./charts
            outPath: ./out
            releaseName: myapp-staging
        
        - uses: git-commit
          config:
            path: ./out
            message: "Updated staging"
        
        - uses: git-push
          config:
            path: ./out
        
        - uses: argocd-update
          config:
            apps:
              - name: myapp-staging
```

**Explanation:**
- Combines Freight from two Warehouses
- One Warehouse tracks images (fast-moving)
- Other Warehouse tracks infrastructure config (slow-moving)
- Allows independent promotion cadences

### Appendix C: ArgoCD Application Examples

#### C.1 Basic Application with Kargo Authorization

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-dev
  namespace: argocd
  annotations:
    # Authorize Kargo Stage to manage this Application
    kargo.akuity.io/authorized-stage: my-project:dev
spec:
  project: default
  
  source:
    repoURL: https://github.com/myorg/gitops.git
    targetRevision: stage/dev
    path: .
  
  destination:
    server: https://kubernetes.default.svc
    namespace: myapp-dev
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

**Explanation:**
- Annotation grants dev Stage permission to update Application
- Points to stage/dev branch (updated by Kargo)
- Auto-sync enabled so ArgoCD syncs automatically
- Creates namespace if it doesn't exist

#### C.2 ApplicationSet for Multiple Stages

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: myapp-all-stages
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - stage: dev
          - stage: staging
          - stage: production
  
  template:
    metadata:
      name: myapp-{{stage}}
      annotations:
        # Dynamic authorization per stage
        kargo.akuity.io/authorized-stage: my-project:{{stage}}
    
    spec:
      project: default
      
      source:
        repoURL: https://github.com/myorg/gitops.git
        targetRevision: stage/{{stage}}
        path: .
      
      destination:
        server: https://kubernetes.default.svc
        namespace: myapp-{{stage}}
      
      syncPolicy:
        syncOptions:
          - CreateNamespace=true
```

**Explanation:**
- Creates three Applications (dev, staging, production)
- Each authorized to its corresponding Kargo Stage
- Each points to its own stage-specific branch
- Reduces duplication in Application definitions

#### C.3 Multi-Source Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
  namespace: argocd
  annotations:
    kargo.akuity.io/authorized-stage: my-project:production
spec:
  project: default
  
  sources:
    # Helm chart from chart repository
    - repoURL: https://charts.example.com
      chart: myapp
      targetRevision: 2.1.0
      helm:
        valueFiles:
          - $values/overlays/production/values.yaml
    
    # Values from Git repository
    - repoURL: https://github.com/myorg/gitops.git
      targetRevision: stage/production
      ref: values
  
  destination:
    server: https://kubernetes.default.svc
    namespace: myapp-production
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Explanation:**
- Uses Helm chart from chart repository
- Overlays values from GitOps repository
- Kargo updates targetRevision of values source
- Allows separating chart version from configuration

### Appendix D: Promotion Task Examples

#### D.1 Reusable Git Update Task

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: PromotionTask
metadata:
  name: standard-git-update
  namespace: my-project
spec:
  vars:
    - name: gitopsRepo
      # Required variable, must be provided when task is used
    - name: stagePath
      # Required variable for path to stage overlay
    - name: imageRepo
      # Required variable for image repository
  
  steps:
    - uses: git-clone
      config:
        repoURL: ${{ vars.gitopsRepo }}
        checkout:
          - branch: main
            path: ./src
          - branch: stage/${{ ctx.stage }}
            create: true
            path: ./out
    
    - uses: git-clear
      config:
        path: ./out
    
    - uses: kustomize-set-image
      as: update-image
      config:
        path: ./src/${{ vars.stagePath }}
        images:
          - image: ${{ vars.imageRepo }}
            tag: ${{ imageFrom(vars.imageRepo).Tag }}
    
    - uses: kustomize-build
      config:
        path: ./src/${{ vars.stagePath }}
        outPath: ./out
    
    - uses: git-commit
      as: commit
      config:
        path: ./out
        messageFromSteps:
          - update-image
    
    - uses: git-push
      config:
        path: ./out
    
    - uses: compose-output
      as: output
      config:
        commit: ${{ task.outputs.commit.commit }}
```

**Explanation:**
- Defines reusable promotion workflow
- Accepts variables for customization
- Outputs commit SHA for use in Stage
- Can be referenced by multiple Stages

#### D.2 Using Promotion Task in Stage

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata:
  name: dev
  namespace: my-project
spec:
  requestedFreight:
    - origin:
        kind: Warehouse
        name: my-warehouse
      sources:
        direct: true
  
  promotionTemplate:
    spec:
      steps:
        # Reference the PromotionTask
        - task:
            name: standard-git-update
          vars:
            - name: gitopsRepo
              value: https://github.com/myorg/gitops.git
            - name: stagePath
              value: overlays/dev
            - name: imageRepo
              value: myapp/service
        
        # Use output from task
        - uses: argocd-update
          config:
            apps:
              - name: myapp-dev
                sources:
                  - repoURL: https://github.com/myorg/gitops.git
                    desiredRevision: ${{ outputs['standard-git-update'].commit }}
```

**Explanation:**
- References PromotionTask by name
- Provides required variables
- Accesses task outputs in subsequent steps
- Enables code reuse across Stages

#### D.3 Pull Request Workflow Task

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: ClusterPromotionTask
metadata:
  name: pr-workflow
spec:
  vars:
    - name: gitopsRepo
    - name: prTitle
      default: "Kargo Promotion"
    - name: prBody
      default: "Automated promotion from Kargo"
  
  steps:
    # Standard git operations
    - uses: git-clone
      config:
        repoURL: ${{ vars.gitopsRepo }}
        checkout:
          - branch: main
            path: ./repo
    
    # Make changes to manifests
    # ... (update steps omitted for brevity)
    
    - uses: git-commit
      config:
        path: ./repo
        message: ${{ vars.prTitle }}
    
    # Push to feature branch
    - uses: git-push
      as: push
      config:
        path: ./repo
        generateTargetBranch: true
    
    # Open pull request
    - uses: git-open-pr
      as: open-pr
      config:
        repoURL: ${{ vars.gitopsRepo }}
        sourceBranch: ${{ outputs.push.branch }}
        targetBranch: main
        title: ${{ vars.prTitle }}
        description: |
          ${{ vars.prBody }}
          
          Freight: ${{ ctx.freight.alias }}
          Stage: ${{ ctx.stage }}
    
    # Wait for PR to be merged
    - uses: git-wait-for-pr
      config:
        repoURL: ${{ vars.gitopsRepo }}
        prNumber: ${{ outputs['open-pr'].pr.id }}
    
    # Merge PR automatically (optional)
    - uses: git-merge-pr
      config:
        repoURL: ${{ vars.gitopsRepo }}
        prNumber: ${{ outputs['open-pr'].pr.id }}
        wait: true
    
    - uses: compose-output
      as: output
      config:
        prNumber: ${{ outputs['open-pr'].pr.id }}
        merged: true
```

**Explanation:**
- Opens pull request instead of direct push
- Waits for PR approval/checks
- Optionally auto-merges after checks pass
- Provides audit trail through PR system
- Cluster-scoped so available to all Projects

### Appendix E: Advanced Configuration Examples

#### E.1 Freight Clone for Hotfix

Using Freight cloning capability to create hotfix Freight:

```yaml
# Production has Freight with these artifacts:
# - frontend:v2.0.0
# - backend:v2.0.0
# - database:v1.5.0

# Hotfix scenario: Critical bug in backend:v2.0.0
# Build and push backend:v2.0.1

# Clone production Freight via UI/CLI:
# 1. Select production Freight
# 2. Click "Clone Freight"
# 3. Select backend artifact
# 4. Change version to v2.0.1
# 5. Create new Freight

# Result: New Freight with:
# - frontend:v2.0.0 (unchanged)
# - backend:v2.0.1 (hotfix)
# - database:v1.5.0 (unchanged)

# Promote hotfix Freight directly to production
# (bypassing dev/staging for emergency)
```

**Use Case:**
- Critical production bug requiring immediate fix
- Don't want to wait for full pipeline
- Keep all other components at production versions
- Skip lower environments for urgency

#### E.2 Release Tagging with Complete Manifest

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata:
  name: production
  namespace: my-project
spec:
  promotionTemplate:
    spec:
      vars:
        - name: releaseVersion
          value: v${{ timestamp("2006.01.02") }}-${{ ctx.freight.alias }}
      
      steps:
        # ... standard promotion steps ...
        
        # Create comprehensive release tag
        - uses: bash
          config:
            script: |
              #!/bin/bash
              cd ./out
              
              # Create annotated tag with full component manifest
              git tag -a "${{ vars.releaseVersion }}" -m "Production Release ${{ vars.releaseVersion }}
              
              Kargo Freight: ${{ ctx.freight.name }}
              Freight Alias: ${{ ctx.freight.alias }}
              Promoted At: $(date -u +%Y-%m-%dT%H:%M:%SZ)
              Promoted By: ${{ ctx.promotion.createdBy }}
              
              Component Manifest:
              ==================
              Frontend:
                Image: myapp/frontend:${{ imageFrom('myapp/frontend').Tag }}
                Digest: ${{ imageFrom('myapp/frontend').Digest }}
              
              Backend:
                Image: myapp/backend:${{ imageFrom('myapp/backend').Tag }}
                Digest: ${{ imageFrom('myapp/backend').Digest }}
              
              Database Migrations:
                Image: myapp/migrations:${{ imageFrom('myapp/migrations').Tag }}
                Digest: ${{ imageFrom('myapp/migrations').Digest }}
              
              Helm Chart:
                Name: myapp
                Version: ${{ chartFrom('myapp').Version }}
              
              Configuration:
                Repository: github.com/myorg/config
                Commit: ${{ commitFrom('github.com/myorg/config').ID }}
                Commit Message: ${{ commitFrom('github.com/myorg/config').Message }}
              "
              
              git push origin "${{ vars.releaseVersion }}"
        
        # Create machine-readable release manifest
        - uses: bash
          config:
            script: |
              #!/bin/bash
              mkdir -p ./out/releases
              
              cat > ./out/releases/${{ vars.releaseVersion }}.json <<EOF
              {
                "version": "${{ vars.releaseVersion }}",
                "freight": {
                  "name": "${{ ctx.freight.name }}",
                  "alias": "${{ ctx.freight.alias }}"
                },
                "stage": "${{ ctx.stage }}",
                "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
                "promotedBy": "${{ ctx.promotion.createdBy }}",
                "components": {
                  "frontend": {
                    "image": "myapp/frontend",
                    "tag": "${{ imageFrom('myapp/frontend').Tag }}",
                    "digest": "${{ imageFrom('myapp/frontend').Digest }}"
                  },
                  "backend": {
                    "image": "myapp/backend",
                    "tag": "${{ imageFrom('myapp/backend').Tag }}",
                    "digest": "${{ imageFrom('myapp/backend').Digest }}"
                  },
                  "migrations": {
                    "image": "myapp/migrations",
                    "tag": "${{ imageFrom('myapp/migrations').Tag }}",
                    "digest": "${{ imageFrom('myapp/migrations').Digest }}"
                  },
                  "chart": {
                    "name": "myapp",
                    "version": "${{ chartFrom('myapp').Version }}"
                  },
                  "config": {
                    "repository": "github.com/myorg/config",
                    "commit": "${{ commitFrom('github.com/myorg/config').ID }}",
                    "message": "${{ commitFrom('github.com/myorg/config').Message }}"
                  }
                }
              }
              EOF
              
              git add releases/${{ vars.releaseVersion }}.json
              git commit -m "Add release manifest for ${{ vars.releaseVersion }}"
              git push
```

**Benefits:**
- Git tag provides human-readable release notes
- JSON manifest enables programmatic access
- External tools can query releases without Kargo
- Complete audit trail of what was deployed
- Immutable record in Git history

#### E.3 Notification Integration

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata:
  name: production
  namespace: my-project
spec:
  promotionTemplate:
    spec:
      steps:
        # ... standard promotion steps ...
        
        # Send Slack notification
        - uses: send-message
          config:
            destination: slack
            channel: "#releases"
            message: |
              🚀 **Production Release Deployed**
              
              **Release:** ${{ vars.releaseVersion }}
              **Freight:** ${{ ctx.freight.alias }}
              **Promoted By:** ${{ ctx.promotion.createdBy }}
              
              **Components:**
              • Frontend: `${{ imageFrom('myapp/frontend').Tag }}`
              • Backend: `${{ imageFrom('myapp/backend').Tag }}`
              • Chart: `${{ chartFrom('myapp').Version }}`
              
              **Links:**
              • [ArgoCD App](https://argocd.example.com/applications/myapp-production)
              • [Git Tag](https://github.com/myorg/gitops/releases/tag/${{ vars.releaseVersion }})
        
        # Send to external tracking system
        - uses: bash
          config:
            script: |
              #!/bin/bash
              curl -X POST https://release-tracker.example.com/api/releases \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${RELEASE_TRACKER_TOKEN}" \
                -d '{
                  "version": "${{ vars.releaseVersion }}",
                  "environment": "production",
                  "freight": "${{ ctx.freight.name }}",
                  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
                  "components": {
                    "frontend": "${{ imageFrom('myapp/frontend').Tag }}",
                    "backend": "${{ imageFrom('myapp/backend').Tag }}"
                  }
                }'
```

**Use Cases:**
- Team awareness via Slack/Teams
- Integration with release management tools
- Triggering downstream automation
- Compliance reporting

### Appendix F: Troubleshooting Guide

#### F.1 Freight Not Being Created

**Symptoms:**
- Warehouse shows no Freight
- New artifact versions not detected

**Diagnostic Steps:**

1. Check Warehouse status:
```bash
kubectl get warehouse -n my-project my-warehouse -o yaml
```

2. Look for errors in status:
```yaml
status:
  conditions:
    - type: Ready
      status: "False"
      reason: DiscoveryFailed
      message: "Failed to list images: unauthorized"
```

**Common Causes:**

**Missing Credentials:**
```yaml
# Create secret for private registry
apiVersion: v1
kind: Secret
metadata:
  name: registry-creds
  namespace: my-project
  labels:
    kargo.akuity.io/cred-type: image
stringData:
  repoURL: ghcr.io
  username: myuser
  password: ghp_xxxxxxxxxxxxx
```

**Incorrect semver Constraint:**
```yaml
# Wrong: No versions match constraint
semverConstraint: ^3.0.0  # But only v2.x.x versions exist

# Fix: Adjust constraint to match actual versions
semverConstraint: ^2.0.0
```

**Freight Creation Criteria Not Met:**
```yaml
# Check if expression prevents creation
freightCreationCriteria:
  expression: |
    imageFrom('frontend').Tag == imageFrom('backend').Tag
# If tags don't match, no Freight created
```

#### F.2 Promotion Failing

**Symptoms:**
- Promotion stuck in Running state
- Promotion shows Failed status

**Diagnostic Steps:**

1. Get Promotion details:
```bash
kubectl get promotion -n my-project <promotion-name> -o yaml
```

2. Check promotion status for errors:
```yaml
status:
  phase: Failed
  error: "git-push step failed: authentication required"
  stepResults:
    - name: git-clone
      status: Succeeded
    - name: git-commit
      status: Succeeded
    - name: git-push
      status: Failed
      error: "remote: Permission denied"
```

**Common Causes:**

**Missing Git Credentials:**
```yaml
# Create Git credentials secret
apiVersion: v1
kind: Secret
metadata:
  name: git-creds
  namespace: my-project
  labels:
    kargo.akuity.io/cred-type: git
stringData:
  repoURL: https://github.com/myorg/gitops.git
  username: myuser
  password: ghp_xxxxxxxxxxxxx  # GitHub PAT
```

**ArgoCD Application Not Authorized:**
```yaml
# Application missing annotation
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-dev
  annotations:
    # ADD THIS:
    kargo.akuity.io/authorized-stage: my-project:dev
```

**Incorrect Expression Syntax:**
```yaml
# Wrong:
value: ${{ imageFrom(vars.imageRepo).Tag }}

# Right:
value: ${{ imageFrom(vars.imageRepo).Tag }}
```

#### F.3 ArgoCD Application Not Syncing

**Symptoms:**
- Promotion succeeds but Application stays OutOfSync
- Application shows old revision

**Diagnostic Steps:**

1. Check Application status:
```bash
kubectl get application -n argocd myapp-dev -o yaml
```

2. Check sync status:
```yaml
status:
  sync:
    status: OutOfSync
    revision: old-commit-sha
  operationState:
    phase: Failed
    message: "ComparisonError: failed to get app details"
```

**Common Causes:**

**Sync Policy Prevents Auto-Sync:**
```yaml
# Application configured for manual sync
spec:
  syncPolicy: {}  # No automated sync!

# Fix: Enable auto-sync
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Target Revision Mismatch:**
```yaml
# Kargo pushed to stage/dev branch
# But Application points elsewhere
spec:
  source:
    targetRevision: main  # Should be stage/dev!

# Kargo argocd-update should set this correctly
```

**ArgoCD Can't Access Repository:**
```bash
# Check ArgoCD repository connection
kubectl get secret -n argocd | grep repo

# Add repository to ArgoCD if missing
argocd repo add https://github.com/myorg/gitops.git \
  --username myuser \
  --password ghp_xxxxxxxxxxxxx
```

#### F.4 Stage Health Reporting Degraded

**Symptoms:**
- Stage shows Unhealthy status
- Promotion succeeded but Stage not healthy

**Diagnostic Steps:**

1. Check Stage status:
```bash
kubectl get stage -n my-project dev -o yaml
```

2. Review health status:
```yaml
status:
  health:
    status: Unhealthy
    issues:
      - "Application myapp-dev is Degraded"
  currentFreight:
    name: abc123
    verificationHistory:
      - phase: Failed
```

**Common Causes:**

**Application Truly Unhealthy:**
```bash
# Check ArgoCD Application
kubectl get application -n argocd myapp-dev

# Check pods in application namespace
kubectl get pods -n myapp-dev

# Common: ImagePullBackOff, CrashLoopBackOff
```

**Verification Failing:**
```yaml
# Check verification configuration
spec:
  verification:
    analysisTemplates:
      - name: smoke-tests
    # If analysis fails, Stage becomes unhealthy

# Check AnalysisRun status
kubectl get analysisrun -n my-project
```

**Health Check Timeout:**
```yaml
# Increase timeout in promotion step
steps:
  - uses: argocd-update
    config:
      apps:
        - name: myapp-dev
    timeout: 10m  # Default might be too short
```

### Appendix G: Expression Reference

Kargo uses expressions extensively in promotion templates. Here's a quick reference:

#### G.1 Context Variables

```yaml
# Current Stage name
${{ ctx.stage }}  # "dev", "production", etc.

# Current Freight
${{ ctx.freight.name }}   # SHA-1 hash identifier
${{ ctx.freight.alias }}  # Human-friendly alias

# Current Promotion
${{ ctx.promotion.name }}       # Promotion resource name
${{ ctx.promotion.createdBy }}  # Who triggered promotion
```

#### G.2 Artifact Functions

```yaml
# Image from Freight
${{ imageFrom('myapp/frontend').Tag }}     # "v2.1.0"
${{ imageFrom('myapp/frontend').Digest }}  # "sha256:abc..."

# Git commit from Freight
${{ commitFrom('github.com/myorg/repo').ID }}       # Commit SHA
${{ commitFrom('github.com/myorg/repo').Message }}  # Commit message

# Helm chart from Freight
${{ chartFrom('my-chart').Version }}  # "1.2.3"

# With Warehouse filter
${{ imageFrom('myapp/frontend', warehouse('my-warehouse')).Tag }}
```

#### G.3 Variable References

```yaml
# Global variables
${{ vars.gitopsRepo }}
${{ vars.imageRepo }}

# Step outputs
${{ outputs.commit.commit }}           # From step with alias "commit"
${{ outputs['update-image'].message }} # Square bracket notation

# Task outputs (in PromotionTask)
${{ task.outputs['step-name'].value }}
```

#### G.4 Utility Functions

```yaml
# Timestamp
${{ timestamp() }}                    # Unix timestamp
${{ timestamp("2006.01.02") }}        # Formatted: 2025.01.15
${{ timestamp("2006-01-02T15:04:05") }}  # ISO format

# Quote for YAML safety
${{ quote(imageFrom('myapp/frontend').Tag) }}
```

#### G.5 Freight Creation Criteria Examples

```yaml
# Tags must match
imageFrom('frontend').Tag == imageFrom('backend').Tag

# Version greater than
imageFrom('myapp').Tag > '2.0.0'

# Commit after date
commitFrom('github.com/myorg/repo').CommitterDate.After(date('2024-01-01'))

# Multiple conditions
imageFrom('frontend').Tag == imageFrom('backend').Tag &&
imageFrom('backend').Tag == chartFrom('my-chart').Version

# Tag doesn't contain alpha/beta
!(imageFrom('myapp').Tag contains 'alpha') &&
!(imageFrom('myapp').Tag contains 'beta')
```

---

## Conclusion

Kargo and ArgoCD together provide a complete GitOps solution for modern Kubernetes deployments. ArgoCD handles the continuous deployment of applications to clusters, while Kargo orchestrates the progressive promotion of changes through multiple stages. By maintaining strict GitOps principles, providing comprehensive audit trails, and enabling flexible promotion workflows, these tools empower teams to deploy confidently and reliably at scale.

The key to success is understanding the separation of concerns: ArgoCD syncs clusters to Git state, while Kargo orchestrates what gets promoted when. Together, they eliminate manual deployment processes, reduce errors, and provide complete visibility into your application lifecycle.

---

## Additional Resources

**Kargo Documentation:**
- Official Docs: https://docs.kargo.io
- GitHub Repository: https://github.com/akuity/kargo
- Quickstart Guide: https://docs.kargo.io/quickstart

**ArgoCD Documentation:**
- Official Docs: https://argo-cd.readthedocs.io
- GitHub Repository: https://github.com/argoproj/argo-cd
- Getting Started: https://argo-cd.readthedocs.io/en/stable/getting_started

**Community:**
- Kargo Discord: https://discord.gg/kargo
- CNCF Slack #argo-cd channel
- Argo Project Community: https://argoproj.github.io/community/

**Related Tools:**
- Argo Rollouts: Progressive delivery strategies
- Argo Workflows: Workflow orchestration
- Argo Events: Event-driven automation
