# CI/CD Pipeline Template with Metadata Injection

## GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: myregistry.io
  IMAGE_NAME: myapp

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image_digest: ${{ steps.build.outputs.digest }}
      build_id: ${{ steps.metadata.outputs.build_id }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for traceability
      
      - name: Generate build metadata
        id: metadata
        run: |
          echo "build_id=build-$(date +%Y%m%d)-${{ github.run_number }}" >> $GITHUB_OUTPUT
          echo "build_timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $GITHUB_OUTPUT
          echo "git_commit=${{ github.sha }}" >> $GITHUB_OUTPUT
          echo "git_short_commit=${GITHUB_SHA:0:7}" >> $GITHUB_OUTPUT
          echo "git_branch=${GITHUB_REF##*/}" >> $GITHUB_OUTPUT
      
      - name: Build Docker image with metadata
        id: build
        run: |
          docker build \
            --label "org.opencontainers.image.source=${{ github.repositoryUrl }}" \
            --label "org.opencontainers.image.revision=${{ steps.metadata.outputs.git_commit }}" \
            --label "org.opencontainers.image.version=${{ github.ref_name }}" \
            --label "org.opencontainers.image.created=${{ steps.metadata.outputs.build_timestamp }}" \
            --label "com.myorg.build.id=${{ steps.metadata.outputs.build_id }}" \
            --label "com.myorg.build.number=${{ github.run_number }}" \
            --label "com.myorg.build.url=${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}" \
            --label "com.myorg.build.branch=${{ steps.metadata.outputs.git_branch }}" \
            --label "com.myorg.git.commit.short=${{ steps.metadata.outputs.git_short_commit }}" \
            --label "com.myorg.git.author=${{ github.actor }}" \
            -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.metadata.outputs.git_short_commit }} \
            -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest \
            .
          
          # Get image digest
          IMAGE_ID=$(docker images -q ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest)
          DIGEST=$(docker inspect $IMAGE_ID --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
          echo "digest=$DIGEST" >> $GITHUB_OUTPUT
      
      - name: Run tests
        run: |
          docker run --rm ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest npm test
      
      - name: Security scan
        id: scan
        run: |
          # Example with Trivy
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy image --severity HIGH,CRITICAL \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          
          SCAN_ID="scan-$(date +%Y%m%d%H%M%S)"
          echo "scan_id=$SCAN_ID" >> $GITHUB_OUTPUT
          
          # Add scan result as label (in real world, push updated image)
          echo "Security scan completed: $SCAN_ID"
      
      - name: Tag image with scan metadata
        run: |
          # Re-tag with scan info (or use registry API to update labels)
          docker tag \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:scanned-${{ steps.metadata.outputs.git_short_commit }}
      
      - name: Push to registry
        run: |
          echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login ${{ env.REGISTRY }} -u ${{ secrets.REGISTRY_USERNAME }} --password-stdin
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.metadata.outputs.git_short_commit }}
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
      
      - name: Create git tag for build
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git tag -a "${{ steps.metadata.outputs.build_id }}" \
            -m "Build: ${{ steps.metadata.outputs.build_id }}" \
            -m "Run: ${{ github.run_number }}" \
            -m "Commit: ${{ steps.metadata.outputs.git_commit }}" \
            -m "Image: ${{ steps.build.outputs.digest }}"
          git push origin "${{ steps.metadata.outputs.build_id }}"

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout K8s manifests
        uses: actions/checkout@v3
      
      - name: Generate deployment metadata
        id: deploy_metadata
        run: |
          echo "deployment_id=deploy-prod-$(date +%Y%m%d%H%M%S)" >> $GITHUB_OUTPUT
          echo "deployment_timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $GITHUB_OUTPUT
      
      - name: Update K8s deployment with metadata
        run: |
          # Update deployment YAML with annotations
          kubectl set image deployment/myapp \
            myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build.outputs.image_digest }} \
            --record
          
          kubectl annotate deployment/myapp \
            git.commit="${{ github.sha }}" \
            git.branch="${GITHUB_REF##*/}" \
            git.repo="${{ github.repositoryUrl }}" \
            build.id="${{ needs.build.outputs.build_id }}" \
            build.number="${{ github.run_number }}" \
            build.url="${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}" \
            build.timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            deployment.id="${{ steps.deploy_metadata.outputs.deployment_id }}" \
            deployment.timestamp="${{ steps.deploy_metadata.outputs.deployment_timestamp }}" \
            deployment.operator="${{ github.actor }}" \
            deployment.run-id="${{ github.run_id }}" \
            image.digest="${{ needs.build.outputs.image_digest }}" \
            --overwrite
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/myapp --timeout=5m
      
      - name: Create deployment tag in git
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git tag -a "${{ steps.deploy_metadata.outputs.deployment_id }}" \
            -m "Deployment to production" \
            -m "Timestamp: ${{ steps.deploy_metadata.outputs.deployment_timestamp }}" \
            -m "Operator: ${{ github.actor }}" \
            -m "Build: ${{ needs.build.outputs.build_id }}" \
            -m "Image: ${{ needs.build.outputs.image_digest }}"
          git push origin "${{ steps.deploy_metadata.outputs.deployment_id }}"
      
      - name: Create deployment record
        run: |
          # Write deployment record for correlation
          cat > deployment-record.json << EOF
          {
            "deploymentId": "${{ steps.deploy_metadata.outputs.deployment_id }}",
            "timestamp": "${{ steps.deploy_metadata.outputs.deployment_timestamp }}",
            "environment": "production",
            "gitCommit": "${{ github.sha }}",
            "buildId": "${{ needs.build.outputs.build_id }}",
            "imageDigest": "${{ needs.build.outputs.image_digest }}",
            "operator": "${{ github.actor }}",
            "runId": "${{ github.run_id }}",
            "runUrl": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
          }
          EOF
          
          # Store in artifact or S3/database
          cat deployment-record.json
```

## GitLab CI Example

```yaml
# .gitlab-ci.yml

variables:
  REGISTRY: myregistry.io
  IMAGE_NAME: myapp
  DOCKER_DRIVER: overlay2

stages:
  - build
  - test
  - scan
  - deploy

before_script:
  - export BUILD_ID="build-$(date +%Y%m%d)-${CI_PIPELINE_ID}"
  - export BUILD_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  - export GIT_SHORT_COMMIT=${CI_COMMIT_SHORT_SHA}

build:
  stage: build
  script:
    - |
      docker build \
        --label "org.opencontainers.image.source=${CI_PROJECT_URL}" \
        --label "org.opencontainers.image.revision=${CI_COMMIT_SHA}" \
        --label "org.opencontainers.image.version=${CI_COMMIT_REF_NAME}" \
        --label "org.opencontainers.image.created=${BUILD_TIMESTAMP}" \
        --label "com.myorg.build.id=${BUILD_ID}" \
        --label "com.myorg.build.number=${CI_PIPELINE_ID}" \
        --label "com.myorg.build.url=${CI_PIPELINE_URL}" \
        --label "com.myorg.build.branch=${CI_COMMIT_REF_NAME}" \
        --label "com.myorg.git.commit.short=${GIT_SHORT_COMMIT}" \
        --label "com.myorg.git.author=${GITLAB_USER_NAME}" \
        -t ${REGISTRY}/${IMAGE_NAME}:${GIT_SHORT_COMMIT} \
        -t ${REGISTRY}/${IMAGE_NAME}:latest \
        .
    
    - docker push ${REGISTRY}/${IMAGE_NAME}:${GIT_SHORT_COMMIT}
    - docker push ${REGISTRY}/${IMAGE_NAME}:latest
    
    # Get digest and save for later stages
    - IMAGE_DIGEST=$(docker inspect ${REGISTRY}/${IMAGE_NAME}:latest --format='{{index .RepoDigests 0}}' | cut -d'@' -f2)
    - echo "IMAGE_DIGEST=${IMAGE_DIGEST}" > build.env
    - echo "BUILD_ID=${BUILD_ID}" >> build.env
  
  artifacts:
    reports:
      dotenv: build.env

deploy:
  stage: deploy
  environment:
    name: production
  dependencies:
    - build
  script:
    - export DEPLOYMENT_ID="deploy-prod-$(date +%Y%m%d%H%M%S)"
    - export DEPLOYMENT_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    - |
      kubectl set image deployment/myapp \
        myapp=${REGISTRY}/${IMAGE_NAME}@${IMAGE_DIGEST}
      
      kubectl annotate deployment/myapp \
        git.commit="${CI_COMMIT_SHA}" \
        git.branch="${CI_COMMIT_REF_NAME}" \
        git.repo="${CI_PROJECT_URL}" \
        build.id="${BUILD_ID}" \
        build.number="${CI_PIPELINE_ID}" \
        build.url="${CI_PIPELINE_URL}" \
        deployment.id="${DEPLOYMENT_ID}" \
        deployment.timestamp="${DEPLOYMENT_TIMESTAMP}" \
        deployment.operator="${GITLAB_USER_NAME}" \
        image.digest="${IMAGE_DIGEST}" \
        --overwrite
```

## Kubernetes Deployment Template

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
    version: "1.0.0"
    environment: production
    team: platform
  annotations:
    # These will be populated by CI/CD
    git.commit: "placeholder"
    git.branch: "placeholder"
    git.repo: "https://github.com/myorg/myrepo"
    build.id: "placeholder"
    build.number: "placeholder"
    build.url: "placeholder"
    deployment.id: "placeholder"
    deployment.timestamp: "placeholder"
    deployment.operator: "placeholder"
    image.digest: "placeholder"
    
    # Documentation
    docs.url: "https://docs.myorg.com/myapp"
    oncall.team: "platform-team"
    oncall.slack: "#platform-oncall"

spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  
  template:
    metadata:
      labels:
        app: myapp
        version: "1.0.0"
        environment: production
      annotations:
        # Propagate to pods
        git.commit: "placeholder"
        deployment.id: "placeholder"
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    
    spec:
      containers:
      - name: myapp
        image: myregistry.io/myapp:latest  # Will be overridden by digest
        imagePullPolicy: Always
        
        # Inject correlation IDs as environment variables
        env:
        - name: GIT_COMMIT
          value: "placeholder"  # Set by CI/CD
        - name: BUILD_ID
          value: "placeholder"
        - name: DEPLOYMENT_ID
          value: "placeholder"
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 9090
          name: metrics
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Dockerfile with Metadata

```dockerfile
# Dockerfile

FROM node:18-alpine AS builder

# Build args for metadata
ARG GIT_COMMIT=unknown
ARG BUILD_ID=unknown
ARG BUILD_NUMBER=unknown
ARG BUILD_TIMESTAMP=unknown
ARG BUILD_URL=unknown

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

# Inject metadata as OCI labels
LABEL org.opencontainers.image.source="https://github.com/myorg/myrepo"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.created="${BUILD_TIMESTAMP}"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.title="MyApp"
LABEL org.opencontainers.image.description="My application"

# Custom labels for our domain model
LABEL com.myorg.build.id="${BUILD_ID}"
LABEL com.myorg.build.number="${BUILD_NUMBER}"
LABEL com.myorg.build.url="${BUILD_URL}"
LABEL com.myorg.build.timestamp="${BUILD_TIMESTAMP}"
LABEL com.myorg.git.commit="${GIT_COMMIT}"
LABEL com.myorg.team="platform"
LABEL com.myorg.oncall="platform-team"

# Also available as environment variables in running container
ENV GIT_COMMIT=${GIT_COMMIT} \
    BUILD_ID=${BUILD_ID} \
    BUILD_NUMBER=${BUILD_NUMBER}

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 8080 9090

CMD ["node", "dist/index.js"]
```

These templates provide complete traceability from code to runtime!
