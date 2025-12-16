---
title: "In subsequent stages, you can read this metadata"
summary: "Let me search more specifically for Git tag creation capabilities in Kargo. Based on my research, I can now provide you with a comprehensive answer about creating tags when Freight reaches a stage."
keywords:
  - "kargo"
  - "production"
  - "yaml"
  - "gitops"
  - "helm"
  - "json"
  - "deployment"
  - "orchestration"
category: "devplatform"
categoryName: "Development Platforms"
weight: 2
date: "2025-12-16"
draft: false
toc: true
---

Let me search more specifically for Git tag creation capabilities in Kargo.Based on my research, I can now provide you with a comprehensive answer about creating tags when Freight reaches a stage.

## Can Kargo Create Tags for All Components When Freight Reaches a Stage?

**Short Answer:** Yes, but **not automatically out-of-the-box**. Kargo doesn't have a built-in "create git tags for all artifacts" feature, but you can implement this yourself using Kargo's promotion steps and metadata capabilities.

---

## **What Kargo Does Provide**

### **1. Git Commits (Built-in)**

The git-commit step commits all changes in a working tree to its checked out branch, and every promotion creates a traceable Git commit with metadata about what was promoted.

**Standard Promotion Flow:**
```yaml
steps:
  - uses: git-clone
    # ... clone repo
  - uses: yaml-update
    # ... update manifests with new image versions
  - uses: git-commit
    as: commit
    config:
      path: ./out
      message: |
        Promoted to ${{ ctx.stage }}
        - frontend: ${{ imageFrom('myapp/frontend').Tag }}
        - backend: ${{ imageFrom('myapp/backend').Tag }}
        - config: ${{ commitFrom('github.com/myorg/config').ID }}
  - uses: git-push
    # ... push changes
```

**Result:** Each promotion creates a Git commit in your GitOps repository that records exactly what was deployed.

### **2. Freight and Stage Metadata**

You can propagate important context between Stages using a set-metadata promotion step, and arbitrary metadata attached to Freight and Stage resources can be retrieved using stageMetadata() and freightMetadata() expression functions.

---

## **How to Create Tags for Component Tracking**

Since Kargo doesn't create tags automatically, here are the approaches you can use:

### **Approach 1: Create Git Tags in Your Promotion Process (Recommended)**

You can use bash commands within Kargo's promotion steps to create Git tags.

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata:
  name: production
spec:
  promotionTemplate:
    spec:
      vars:
        - name: gitopsRepo
          value: https://github.com/myorg/gitops.git
        - name: releaseTag
          # Compose a release tag from component versions
          value: |
            release-${{ ctx.stage }}-
            fe-${{ imageFrom('myapp/frontend').Tag }}-
            be-${{ imageFrom('myapp/backend').Tag }}
      
      steps:
        # 1. Clone and update manifests
        - uses: git-clone
          config:
            repoURL: ${{ vars.gitopsRepo }}
            checkout:
              - branch: main
                path: ./repo
        
        # 2. Update YAML with new versions
        - uses: yaml-update
          config:
            path: ./repo/manifests/production.yaml
            updates:
              - key: frontend.image.tag
                value: ${{ imageFrom('myapp/frontend').Tag }}
              - key: backend.image.tag
                value: ${{ imageFrom('myapp/backend').Tag }}
        
        # 3. Commit the changes
        - uses: git-commit
          as: commit
          config:
            path: ./repo
            message: |
              Promoted to production
              - Frontend: ${{ imageFrom('myapp/frontend').Tag }}
              - Backend: ${{ imageFrom('myapp/backend').Tag }}
              - Chart: ${{ chartFrom('my-chart').Version }}
              - Config: ${{ commitFrom('github.com/myorg/config').ID }}
        
        # 4. Create Git tag using bash
        - uses: bash
          config:
            script: |
              #!/bin/bash
              cd ./repo
              
              # Create annotated tag with component details
              git tag -a "${{ vars.releaseTag }}" -m "Production Release
              Freight: ${{ ctx.freight.name }}
              Stage: ${{ ctx.stage }}
              Promoted: $(date -u +%Y-%m-%dT%H:%M:%SZ)
              
              Components:
              - frontend: ${{ imageFrom('myapp/frontend').Tag }} (${{ imageFrom('myapp/frontend').Digest }})
              - backend: ${{ imageFrom('myapp/backend').Tag }} (${{ imageFrom('myapp/backend').Digest }})
              - helm-chart: ${{ chartFrom('my-chart').Version }}
              - config: ${{ commitFrom('github.com/myorg/config').ID }}"
        
        # 5. Push commit and tags
        - uses: git-push
          config:
            path: ./repo
            targetBranch: main
        
        # 6. Push the tag separately
        - uses: bash
          config:
            script: |
              #!/bin/bash
              cd ./repo
              git push origin "${{ vars.releaseTag }}"
```

**Result:** 
- Git commit shows the changes
- Git tag captures the complete component snapshot
- Tag is named with all component versions: `release-production-fe-v2.1.0-be-v3.0.1`

---

### **Approach 2: Store Component Manifest in Git**

Create a dedicated "release manifest" file that gets versioned:

```yaml
steps:
  # ... clone, update manifests steps ...
  
  # Create release manifest file
  - uses: bash
    config:
      script: |
        #!/bin/bash
        cat > ./repo/releases/production-$(date +%Y%m%d-%H%M%S).yaml <<EOF
        apiVersion: v1
        kind: ReleaseManifest
        metadata:
          stage: ${{ ctx.stage }}
          freight: ${{ ctx.freight.name }}
          timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
        components:
          frontend:
            image: myapp/frontend
            tag: ${{ imageFrom('myapp/frontend').Tag }}
            digest: ${{ imageFrom('myapp/frontend').Digest }}
          backend:
            image: myapp/backend
            tag: ${{ imageFrom('myapp/backend').Tag }}
            digest: ${{ imageFrom('myapp/backend').Digest }}
          helm:
            chart: my-chart
            version: ${{ chartFrom('my-chart').Version }}
          config:
            repo: github.com/myorg/config
            commit: ${{ commitFrom('github.com/myorg/config').ID }}
        EOF
  
  - uses: git-commit
    config:
      path: ./repo
      message: "Release manifest for production deployment"
  
  - uses: git-push
    config:
      path: ./repo
```

**Result:** Every production deployment creates a YAML file tracking all component versions.

---

### **Approach 3: Use Freight Metadata to Track Releases**

Arbitrary metadata can be attached to Freight and Stage resources using the set-metadata promotion step.

```yaml
steps:
  # ... promotion steps ...
  
  # Tag this Freight with production metadata
  - uses: set-metadata
    config:
      target: freight
      metadata:
        productionReleaseTag: release-${{ ctx.stage }}-${{ timestamp() }}
        productionDeployedAt: ${{ timestamp() }}
        componentVersions: |
          {
            "frontend": "${{ imageFrom('myapp/frontend').Tag }}",
            "backend": "${{ imageFrom('myapp/backend').Tag }}",
            "chart": "${{ chartFrom('my-chart').Version }}"
          }
```

**Access later:**
```yaml
# In subsequent stages, you can read this metadata
- uses: bash
  config:
    script: |
      echo "Previous production release: ${{ freightMetadata('productionReleaseTag') }}"
```

---

### **Approach 4: External Release Tracking System**

Use Kargo's notification capabilities or webhooks to record releases externally:

```yaml
steps:
  # ... promotion steps ...
  
  # Send release info to external system
  - uses: http-post
    config:
      url: https://your-release-tracker.com/api/releases
      body: |
        {
          "stage": "${{ ctx.stage }}",
          "freight": "${{ ctx.freight.name }}",
          "timestamp": "${{ timestamp() }}",
          "components": {
            "frontend": {
              "tag": "${{ imageFrom('myapp/frontend').Tag }}",
              "digest": "${{ imageFrom('myapp/frontend').Digest }}"
            },
            "backend": {
              "tag": "${{ imageFrom('myapp/backend').Tag }}",
              "digest": "${{ imageFrom('myapp/backend').Digest }}"
            }
          }
        }
```

**Or send to Slack:**
```yaml
- uses: send-message
  config:
    destination: slack
    channel: "#releases"
    message: |
      🚀 Production Release Complete
      Freight: ${{ ctx.freight.alias }}
      Components:
      • Frontend: ${{ imageFrom('myapp/frontend').Tag }}
      • Backend: ${{ imageFrom('myapp/backend').Tag }}
      • Chart: ${{ chartFrom('my-chart').Version }}
```

---

## **Comparison: Kargo's Approach vs. Traditional Versioning**

| Aspect | Traditional Tagging | Kargo Built-in | Custom Kargo Implementation |
|--------|-------------------|----------------|---------------------------|
| **Unified version tag** | ✅ Yes (v1.5.0 everywhere) | ❌ No automatic tags | ✅ Can create custom tags |
| **Component-level versions** | ❌ Often lost | ✅ Freight tracks each | ✅ Can expose in tags/manifests |
| **Traceability** | ⚠️ Requires external tracking | ✅ Freight + Git commits | ✅✅ Tags + Freight + commits |
| **External visibility** | ✅ Easy (just check tags) | ⚠️ Need Kargo access | ✅ Custom tags visible externally |
| **Rollback ease** | ✅ Simple (checkout v1.4.0) | ✅ Promote old Freight | ✅ Checkout tag or Freight |
| **Audit trail** | ⚠️ Tags can be deleted/moved | ✅ Immutable Freight | ✅ Git tags + Freight |

---

## **Best Practice Recommendation**

For **maximum traceability** outside of Kargo, I recommend a **hybrid approach**:

### **1. Let Kargo do what it does best:**
- Track component versions in Freight
- Create Git commits for every promotion
- Use Freight metadata for runtime tracking

### **2. Add custom tagging for external visibility:**

```yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: PromotionTask
metadata:
  name: production-release-with-tagging
spec:
  vars:
    - name: releaseVersion
      # Generate semantic version or use custom format
      value: v${{ timestamp('2006.01.02') }}-${{ ctx.freight.alias }}
  
  steps:
    # Standard promotion steps
    - uses: git-clone
      # ... clone repo
    
    - uses: yaml-update
      # ... update manifests
    
    - uses: git-commit
      as: commit
      config:
        path: ./repo
        message: |
          Release ${{ vars.releaseVersion }} to production
          
          Freight: ${{ ctx.freight.name }} (${{ ctx.freight.alias }})
          
          Component Versions:
          - Frontend: ${{ imageFrom('myapp/frontend').Tag }} @ ${{ imageFrom('myapp/frontend').Digest }}
          - Backend: ${{ imageFrom('myapp/backend').Tag }} @ ${{ imageFrom('myapp/backend').Digest }}
          - Chart: ${{ chartFrom('my-chart').Version }}
          - Config: ${{ commitFrom('github.com/myorg/config').ID }}
    
    # Create release tag
    - uses: bash
      config:
        script: |
          #!/bin/bash
          cd ./repo
          
          # Create comprehensive annotated tag
          git tag -a "${{ vars.releaseVersion }}" \
            -m "Production Release ${{ vars.releaseVersion }}
          
          Kargo Freight: ${{ ctx.freight.name }}
          Freight Alias: ${{ ctx.freight.alias }}
          Deployed: $(date -u +%Y-%m-%dT%H:%M:%SZ)
          
          Component Manifest:
          ==================
          Frontend Image:
            Repository: myapp/frontend
            Tag: ${{ imageFrom('myapp/frontend').Tag }}
            Digest: ${{ imageFrom('myapp/frontend').Digest }}
          
          Backend Image:
            Repository: myapp/backend
            Tag: ${{ imageFrom('myapp/backend').Tag }}
            Digest: ${{ imageFrom('myapp/backend').Digest }}
          
          Helm Chart:
            Name: my-chart
            Version: ${{ chartFrom('my-chart').Version }}
          
          Configuration:
            Repo: github.com/myorg/config
            Commit: ${{ commitFrom('github.com/myorg/config').ID }}
          "
    
    - uses: git-push
      config:
        path: ./repo
    
    # Push tags
    - uses: bash
      config:
        script: |
          cd ./repo
          git push origin "${{ vars.releaseVersion }}"
    
    # Also create release manifest file
    - uses: bash
      config:
        script: |
          cat > ./repo/releases/${{ vars.releaseVersion }}.json <<EOF
          {
            "version": "${{ vars.releaseVersion }}",
            "freight": {
              "name": "${{ ctx.freight.name }}",
              "alias": "${{ ctx.freight.alias }}"
            },
            "stage": "${{ ctx.stage }}",
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
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
              "chart": {
                "name": "my-chart",
                "version": "${{ chartFrom('my-chart').Version }}"
              },
              "config": {
                "repo": "github.com/myorg/config",
                "commit": "${{ commitFrom('github.com/myorg/config').ID }}"
              }
            }
          }
          EOF
          
          git add releases/${{ vars.releaseVersion }}.json
          git commit -m "Add release manifest for ${{ vars.releaseVersion }}"
          git push
```

---

## **What This Gives You**

**Inside Kargo:**
- ✅ Full Freight tracking with all component versions
- ✅ Immutable audit trail
- ✅ Easy promotion/rollback via UI

**Outside Kargo:**
- ✅ Git tags anyone can see: `git tag -l`
- ✅ Detailed tag annotations: `git show v2025.01.15-brave-eagle`
- ✅ Release manifest files for programmatic access
- ✅ Standard Git operations work: `git checkout v2025.01.15-brave-eagle`

**External Systems Can:**
- Query Git tags to see what's in production
- Parse release manifest JSON files
- Build dashboards from Git history
- Integrate with existing release processes that expect tags

---

## **Summary**

**Direct Answer:**
- Kargo doesn't automatically create Git tags for component combinations
- BUT you can easily add this yourself using bash steps in promotion templates
- Kargo DOES track everything in Freight objects and Git commits

**Recommended Approach:**
1. Use Kargo's Freight for internal tracking (it's excellent at this)
2. Add custom Git tags in your promotion process for external visibility
3. Optionally create release manifest files for programmatic access
4. Use Freight metadata for runtime tracking between stages

This hybrid approach gives you the best of both worlds: Kargo's powerful promotion orchestration PLUS traditional Git tags for external systems that expect them.

**Does this answer your question? Would you like me to provide a complete working example for your specific multi-repo setup?**
