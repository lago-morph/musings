---
title: "Production Readiness Deep-Dive Prompt Guide"
summary: "Production Readiness Deep-Dive Prompt Guide is a infrastructure document covering Production Readiness Deep-Dive Prompt Guide and How to Use This Guide. This resource provides information and guidance on the topic. See the full document for detailed information and implementation details."
keywords:
  - "kubernetes"
  - "production"
  - "database"
  - "deployment"
  - "monitoring"
  - "observability"
  - "metrics"
  - "logging"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
---

# Production Readiness Deep-Dive Prompt Guide

## How to Use This Guide

This guide contains a collection of prompts designed to generate detailed, in-depth information on specific production readiness topics. The prompts are structured to work with AI assistants to produce comprehensive technical guidance.

### Contents

This prompt contains usage instructions explaining the pattern, one priming prompt to establish context for AI conversations, and 20 topic-specific prompts.

The prompts cover:

- Multi-replica testing
- Data durability
- Observability
- Runbooks
- Blue/green deployment
- Load testing
- Chaos engineering
- Service mesh
- Resource management
- Monitoring/alerting
- Secrets management
- Configuration management
- Persistent storage
- Database connections
- Health checks
- Graceful shutdown
- Logging strategy
- Incident response
- Pre-production validation
- Capacity planning

### Usage Pattern

1. **Start a new conversation** with your AI assistant for each topic area you want to explore
2. **Copy and paste the Priming Prompt** (below) to establish context
3. **Copy and paste one or more Topic-Specific Prompts** to get detailed guidance on that area
4. **Continue the conversation** by asking follow-up questions or requesting clarifications
5. **Repeat** with additional topic prompts in the same conversation if they're related

### Why This Structure?

The priming prompt establishes who you are (experienced traditional ops professional), what you're doing (moving to Kubernetes), and what kind of information you need (actionable, vendor-neutral guidance). This context allows the topic-specific prompts to be concise while still generating high-quality, relevant responses.

### Tips for Best Results

- **Be specific in follow-ups**: If a response is too high-level, ask for concrete examples or step-by-step procedures
- **Request checklists**: Ask for evaluation checklists or readiness assessments for each topic
- **Ask for scenarios**: Request specific failure scenarios or edge cases to consider
- **Combine related topics**: You can use multiple topic prompts in one conversation if they're closely related
- **Adapt to your context**: Mention your specific technologies (database type, programming languages) to get more targeted advice

---

## Priming Prompt

Copy and paste this prompt at the start of each new conversation to establish context:

```
I am an experienced technical architect with a background in traditional Unix and PC server deployments. I'm responsible for taking a microservices application that was developed and tested using docker-compose with single replicas of each service, and deploying it to production on a managed Kubernetes service in the cloud.

My goals are to:
- Ensure the application scales with load
- Make it robust under non-ideal conditions  
- Achieve data durability (resilient to application and hardware failures)
- Provide predictable, manageable operations for our Tier 2 operations team

Our operations model has three tiers:
- Tier 1: End users and their supervisors handle basic questions
- Tier 2: Operations platform personnel monitor systems and handle initial issue remediation
- Tier 3: My development and DevOps team handles complex issues and code changes

I want to minimize Tier 3 escalations by empowering Tier 2 with proper tools, documentation, runbooks, and observability.

We are using:
- Managed Kubernetes service (cloud provider)
- Cloud-managed databases (not databases running in Kubernetes)
- A platform-provided CI/CD pipeline with dev/staging/production environments
- Blue/green deployment strategy
- Service mesh (for traffic management and observability)

Please provide guidance that is:
- Vendor-neutral but acknowledges managed services context
- Actionable and practical, not just theoretical
- Focused on operational excellence and Tier 2 enablement
- Appropriate for someone experienced with traditional ops but new to distributed systems

I understand distributed systems concepts but need help translating them into concrete practices for my production environment.
```

---

## Topic-Specific Prompts

### 1. Multi-Replica State Discovery and Testing

```
Provide detailed guidance on testing whether my microservices are truly stateless and can run as multiple replicas. Our services have only been tested with single replicas in docker-compose.

Cover:
- Specific test scenarios that reveal hidden state dependencies
- How to design load tests that expose race conditions and concurrency issues
- What patterns to look for in code that indicate state problems (sessions, file I/O, caches, singletons)
- A testing progression plan (how many replicas to test with, for how long)
- Tools and techniques for discovering inter-pod dependencies
- How to validate that session management, file uploads, and caching work correctly with multiple replicas
- Common pitfalls when moving from 1 to N replicas

Include a checklist of specific tests to perform and questions to ask about the application architecture.
```

### 2. Data Durability and Backup Strategies

```
Provide comprehensive guidance on protecting data durability in a Kubernetes environment where we use cloud-managed databases and may need persistent volumes for application data.

Cover:
- How to categorize data by criticality and choose appropriate protection strategies
- Backup strategies for cloud-managed databases (frequency, retention, testing)
- RPO and RTO definition and how to meet different requirements
- Persistent volume backup approaches for application data
- Object storage strategies for unstructured data (uploads, generated files)
- Disaster recovery planning and testing procedures
- How to validate that backups actually work (restore testing)
- Monitoring backup health and alerting on failures
- Documentation requirements for recovery procedures

Include a checklist for assessing current data protection posture and identifying gaps.
```

### 3. Observability Architecture for Operations

```
Provide detailed guidance on building an observability system that enables Tier 2 operations personnel to diagnose and resolve issues without developer expertise.

Cover:
- What metrics to collect and why (the "golden signals" and beyond)
- Structured logging design for distributed systems (correlation IDs, log levels, JSON formatting)
- How to implement distributed tracing and when it's valuable
- Designing Grafana dashboards that answer operational questions
- What makes a dashboard useful vs. overwhelming for non-developers
- Alert design philosophy (what to alert on, how to write actionable alerts)
- Log aggregation and search strategies for troubleshooting
- How to make metrics, logs, and traces correlate for effective investigation
- Retention policies for metrics and logs

Include a checklist of observability capabilities needed and dashboard design principles.
```

### 4. Runbook Development for Non-Developer Operations

```
Provide detailed guidance on creating effective runbooks that enable Tier 2 operations personnel to resolve issues independently.

Cover:
- The anatomy of an effective runbook (structure, required sections)
- How to write diagnosis steps that non-developers can follow
- How to write resolution procedures that are clear and safe
- When to escalate vs. when to remediate
- How to identify what runbooks you need (common failure patterns)
- Maintaining and updating runbooks based on incidents
- Linking runbooks to alerts and dashboards
- Examples of good vs. bad runbook content
- How to test runbooks with the operations team
- Creating an operations handbook as an overview document

Include templates for common runbook types and a checklist of runbook quality criteria.
```

### 5. Blue/Green Deployment Implementation

```
Provide detailed guidance on implementing blue/green deployments for zero-downtime releases in Kubernetes.

Cover:
- How blue/green deployment works conceptually
- Why blue/green is valuable for mission-critical applications
- Implementation in Kubernetes (Services, labels, selectors)
- Managing database schema changes with blue/green (backward compatibility)
- Health check design for pre-traffic validation
- Rollback procedures and when to use them
- Monitoring during blue/green switches
- Communication and coordination process
- Handling stateful services in blue/green
- Cost implications of running two environments
- Integration with CI/CD pipelines

Include a checklist of blue/green readiness and a decision framework for when to rollback.
```

### 6. Load Testing Strategy and Execution

```
Provide detailed guidance on load testing a distributed microservices application before production deployment.

Cover:
- Designing realistic load test scenarios (user patterns, traffic mix)
- How to establish performance baselines
- Progressive load testing (baseline → expected → peak → breaking point)
- What metrics to measure during load testing
- How long to run sustained load tests and why
- Identifying bottlenecks and resource constraints
- Testing auto-scaling behavior under load
- Load testing tools and approaches for Kubernetes
- Interpreting load test results and identifying problems
- When load testing indicates production readiness vs. more work needed

Include a checklist of load testing scenarios to execute and success criteria.
```

### 7. Chaos Engineering for Resilience Validation

```
Provide detailed guidance on chaos engineering practices to validate system resilience before and after production deployment.

Cover:
- What chaos engineering is and why it's valuable
- Starting with chaos testing in non-production environments
- Types of failures to inject (pod kills, node failures, network issues, resource exhaustion, dependency failures)
- How to design chaos experiments (hypothesis, execution, observation)
- Tools for chaos testing in Kubernetes
- Measuring system resilience (recovery time, user impact)
- Building confidence to run chaos tests in production
- What to do when chaos tests reveal critical weaknesses
- Creating a chaos testing program (frequency, scope, evolution)
- Documenting chaos test results and improvements

Include a progression plan for chaos testing and a checklist of failure scenarios to validate.
```

### 8. Service Mesh Implementation and Configuration

```
Provide detailed guidance on implementing and configuring a service mesh for traffic management, resilience, and observability.

Cover:
- What a service mesh is and what problems it solves
- When you need a service mesh vs. when it's overkill
- How service mesh works (sidecars, control plane, data plane)
- Key capabilities: traffic routing, retries, circuit breaking, timeouts, load balancing
- Observability benefits (distributed tracing, service-to-service metrics)
- Security features (mutual TLS, service identity)
- What application changes are needed to work with a service mesh
- Configuration patterns (timeouts, retry policies, circuit breakers)
- Operations implications (new debugging surface, configuration management)
- How to use service mesh observability tools for troubleshooting
- Training operations team on service mesh concepts

Include a checklist of service mesh readiness and configuration review points.
```

### 9. Kubernetes Resource Management and Sizing

```
Provide detailed guidance on setting CPU and memory requests/limits for Kubernetes pods and planning cluster capacity.

Cover:
- Understanding requests vs. limits and how they affect scheduling
- How to determine appropriate resource values (load testing, monitoring)
- Consequences of under-provisioning (OOMKilled, throttling) and over-provisioning (waste, cost)
- Horizontal Pod Autoscaler (HPA) configuration and testing
- Vertical Pod Autoscaler (VPA) use cases
- Setting minimum and maximum replica counts
- Quality of Service (QoS) classes and their implications
- Node capacity planning and headroom
- Resource quota patterns for teams/namespaces
- Monitoring resource utilization vs. requests/limits

Include a checklist for resource sizing and a process for tuning based on production metrics.
```

### 10. Monitoring and Alerting Design

```
Provide detailed guidance on designing monitoring and alerting that enables operations to detect and respond to issues effectively.

Cover:
- What to monitor (application, infrastructure, business metrics)
- Choosing the right metrics (signal vs. noise)
- Alert design principles (actionable, timely, contextual)
- Alert severity levels and when to use them
- Threshold tuning to minimize false positives
- Alert fatigue and how to avoid it
- Notification channels and escalation paths
- Alert messages: what to include, how to phrase them
- Linking alerts to runbooks and dashboards
- Testing alerting (triggering test alerts, validating delivery)
- Alert review and refinement process

Include a checklist of alerting best practices and an alert quality rubric.
```

### 11. Secrets Management Strategy

```
Provide detailed guidance on managing secrets (passwords, API keys, certificates) in Kubernetes securely.

Cover:
- Kubernetes Secrets vs. external secret management systems
- Encryption at rest for Kubernetes Secrets
- RBAC for limiting secret access
- Secret rotation strategies and automation
- Mounting secrets as environment variables vs. volume mounts
- Integration with external secret managers (Vault, cloud secret services)
- Secrets in CI/CD pipelines (how to handle securely)
- Audit logging for secret access
- What to do when secrets are compromised
- Documentation of secret locations without exposing values
- Operations team secret access policies

Include a checklist of secret security practices and a secret rotation procedure template.
```

### 12. Configuration Management Across Environments

```
Provide detailed guidance on managing application configuration across dev, staging, and production environments in Kubernetes.

Cover:
- ConfigMaps for non-sensitive configuration
- Structuring configuration (environment variables, files, both)
- Configuration per environment (dev, staging, production)
- Immutable configuration strategy (deploy new version vs. update in place)
- Configuration validation before deployment
- Version control for configuration
- How applications should consume configuration
- Handling configuration changes (do they require restarts?)
- Configuration documentation for operations
- Troubleshooting configuration issues

Include a checklist of configuration management best practices.
```

### 13. Persistent Storage Strategy

```
Provide detailed guidance on using persistent volumes in Kubernetes for application data that must survive pod restarts.

Cover:
- When to use persistent volumes vs. object storage vs. external databases
- StatefulSets vs. Deployments for stateful services
- Storage classes and performance characteristics
- Provisioning persistent volumes (static vs. dynamic)
- Volume expansion and capacity planning
- Backup strategies for persistent volumes (snapshots, replication)
- Volume access modes (ReadWriteOnce, ReadWriteMany)
- Monitoring volume usage and alerting on capacity
- Handling volume failures and data recovery
- Persistent volume lifecycle (creation, attachment, deletion)

Include a checklist of persistent storage considerations and decision criteria.
```

### 14. Database Connection Management

```
Provide detailed guidance on managing database connections from Kubernetes pods to avoid exhaustion and performance issues.

Cover:
- Why connection pooling matters in multi-replica environments
- Connection pool sizing (per pod, total across all pods)
- Connection pool configuration parameters (min, max, timeout, idle)
- Using connection pooling proxies (PgBouncer, ProxySQL)
- Monitoring database connections (active, idle, refused)
- What happens when connection limits are reached
- Database connection limits and how to adjust them
- Graceful handling of connection failures and retries
- Connection management during scaling events (pods starting/stopping)
- Load testing database connection behavior

Include a checklist of connection management configuration and a troubleshooting guide for connection issues.
```

### 15. Health Checks and Readiness Probes

```
Provide detailed guidance on implementing health checks, liveness probes, and readiness probes in Kubernetes.

Cover:
- Difference between liveness, readiness, and startup probes
- What each probe type should check
- How Kubernetes uses probe results (traffic routing, restarts)
- Implementing health check endpoints in applications
- Probe configuration parameters (delay, timeout, period, threshold)
- Health check dependencies (database, external APIs)
- Avoiding cascading failures through health checks
- Testing health checks (simulating failures)
- Monitoring health check success rates
- Health checks during deployments and scaling

Include a checklist of health check implementation requirements and common mistakes to avoid.
```

### 16. Graceful Shutdown and Pod Termination

```
Provide detailed guidance on implementing graceful shutdown in applications to avoid disrupting requests during pod termination.

Cover:
- Kubernetes pod termination lifecycle (SIGTERM, grace period, SIGKILL)
- Why graceful shutdown matters (avoiding failed requests during deployments)
- Implementing shutdown handlers in applications
- Draining in-flight requests before shutdown
- Handling long-running operations during shutdown
- PreStop hooks and when to use them
- Grace period configuration (how long is enough?)
- Connection draining from load balancers
- Testing graceful shutdown
- Monitoring shutdown behavior

Include a checklist of graceful shutdown implementation steps.
```

### 17. Logging Strategy for Distributed Systems

```
Provide detailed guidance on implementing logging for distributed microservices that enables effective troubleshooting.

Cover:
- Structured logging (JSON format, consistent fields)
- Log levels and when to use each (ERROR, WARN, INFO, DEBUG)
- Correlation IDs for tracing requests across services
- What to include in every log entry (timestamp, service, pod, correlation ID)
- Log aggregation and centralization
- Log retention and storage costs
- Searching and filtering logs efficiently
- Avoiding log noise (what not to log)
- Performance implications of logging
- Log security (avoiding sensitive data in logs)
- Operations team log analysis training

Include a checklist of logging implementation requirements and log entry design guidelines.
```

### 18. Incident Response and Post-Mortems

```
Provide detailed guidance on incident response processes and conducting effective post-mortem reviews.

Cover:
- Incident severity levels and classification
- Incident response roles (incident commander, communications, technical)
- Communication during incidents (who to notify, how often)
- Incident timeline tracking and documentation
- When to escalate and to whom
- Blameless post-mortem philosophy
- Conducting post-mortem meetings effectively
- Post-mortem documentation (what happened, why, how to prevent)
- Tracking action items from post-mortems
- Sharing lessons learned across teams
- Building incident response muscle through practice

Include an incident response checklist and a post-mortem template.
```

### 19. Pre-Production Validation Gates

```
Provide detailed guidance on establishing validation gates that code must pass before production deployment.

Cover:
- Types of validation gates (automated tests, manual checks, approvals)
- Test coverage requirements for production readiness
- Performance testing gates (load test pass criteria)
- Security scanning and vulnerability thresholds
- Configuration validation
- Health check and smoke test validation
- Backup and restore testing requirements
- Runbook validation with operations team
- Staging environment validation duration
- Deployment checklist and sign-off process

Include a comprehensive pre-production checklist and gate criteria.
```

### 20. Capacity Planning and Growth Management

```
Provide detailed guidance on capacity planning to ensure the system can handle growth without unexpected failures.

Cover:
- Establishing current capacity baseline
- Projecting future growth (users, data, traffic)
- Resource headroom philosophy (how much spare capacity?)
- Monitoring capacity utilization trends
- Triggers for capacity expansion (automated and manual)
- Scaling dimensions (replicas, nodes, storage, database)
- Cost implications of over-provisioning vs. under-provisioning
- Capacity testing (validating system at projected future load)
- Database capacity planning (storage, connections, query throughput)
- Network capacity considerations
- Quarterly capacity review process

Include a capacity planning worksheet and monitoring checklist.
```

---

## Advanced Usage

### Combining Prompts

You can combine related prompts in a single conversation. For example, after using the priming prompt:

1. Use the "Multi-Replica State Discovery" prompt
2. Follow with the "Load Testing Strategy" prompt
3. Then use the "Chaos Engineering" prompt

This creates a comprehensive testing and validation conversation.

### Requesting Specific Formats

When using topic prompts, you can request specific output formats:

- "Provide this as a step-by-step implementation guide"
- "Create this as a decision tree for troubleshooting"
- "Format this as a training document for operations personnel"
- "Give me this as a table comparing approaches"
- "Provide example configurations or code samples"

### Following Up for Depth

After receiving a response to a topic prompt, dig deeper:

- "Can you provide a specific example of [concept] in a [your context] environment?"
- "What are the most common mistakes teams make with [topic]?"
- "How would this approach differ if we were using [specific technology]?"
- "Can you walk through a specific failure scenario and how to diagnose it?"
- "What metrics or KPIs should we track for [topic]?"

### Adapting to Your Technology Stack

After the priming prompt, mention your specific technologies:

- "We're using PostgreSQL as our database"
- "Our services are written in Java with Spring Boot"
- "We're on AWS EKS for Kubernetes"
- "We use Istio as our service mesh"

This allows topic prompts to generate more specific, actionable guidance.

---

## Prompt Maintenance

These prompts are designed to be relatively timeless, focusing on concepts and patterns rather than specific tool versions. However, you may want to:

- Add technology-specific variants for your environment
- Create prompts for topics specific to your application domain
- Evolve prompts based on what information proves most useful
- Share and refine prompts across your team

Consider the prompts as starting points that can be refined and customized for your organization's specific needs and context.
