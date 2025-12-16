---
title: "Runbooks"
summary: "Below is a practical, ops-first guide written for an experienced Unix/PC server architect who is new to operating distributed systems at scale. It assumes you understand the theory—but want concrete, repeatable practices that keep Tier 3 asleep and let Tier 2 resolve the majority of incidents safely."
keywords:
  - "deployment"
  - "runbooks"
  - "kubernetes"
  - "platform"
  - "database"
  - "markdown"
  - "scaling"
  - "staging"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
---

Below is a **practical, ops-first guide** written for an experienced Unix/PC server architect who is new to *operating* distributed systems at scale. It assumes you understand the theory—but want concrete, repeatable practices that **keep Tier 3 asleep** and let Tier 2 resolve the majority of incidents safely.

---

# 1. Mental Model Shift (Important Framing)

Before runbooks, align expectations—this shapes how you write them.

### Traditional Ops Mindset (what Tier 2 may expect)

* “Find the broken server”
* “Restart the service”
* “Look at logs on the box”
* “Fix it so it stays fixed”

### Kubernetes / Microservices Reality

* There is **no single server**
* Restarting things is **normal, expected, and safe**
* Many failures are **non-actionable symptoms** (transient, self-healing)
* Permanent fixes usually require **code or config changes (Tier 3)**

👉 **Runbooks must explicitly state what *not* to fix** and what “normal” looks like.

---

# 2. What a Runbook Is (and Is Not)

**A runbook is a controlled, safe decision tree** that:

* Guides Tier 2 from **alert → diagnosis → safe remediation**
* Limits blast radius
* Makes escalation predictable and justified

**A runbook is NOT:**

* A design doc
* A tutorial on Kubernetes
* A dump of kubectl commands without context
* A place to “debug like a developer”

---

# 3. Anatomy of an Effective Runbook

Every production runbook should follow **the same structure**, so Tier 2 never has to guess.

## 3.1 Standard Runbook Structure (Mandatory)

### 1. Metadata (Top of File)

```text
Runbook Name:
Service(s):
Severity:
Last Reviewed:
Owner (Tier 3):
Applies To: (prod / staging / both)
```

Purpose:

* Ownership clarity
* Trust that it’s current
* Scope awareness

---

### 2. Trigger Conditions (Why You Are Here)

Describe **exactly** how someone ends up reading this runbook.

**Good**

> This runbook is used when:
>
> * Alert: `checkout-api High Error Rate`
> * Dashboard shows >5% 5xx for 3 minutes

**Bad**

> “When checkout is broken”

---

### 3. User Impact (Plain Language)

Tier 2 must understand *business impact* immediately.

**Example**

```text
Impact:
- Users may be unable to complete purchases
- Existing sessions are not affected
- No data loss expected
```

This helps Tier 2:

* Communicate with stakeholders
* Judge urgency
* Decide escalation timing

---

### 4. Known Normal Conditions (Critical)

This prevents false escalations.

**Example**

```text
Normal / Expected:
- Short spikes in 5xx during deployments (≤2 minutes)
- Pod restarts during node maintenance
- One replica occasionally restarting under load
```

---

### 5. Diagnosis (Decision Tree, Not Investigation)

This is the **most important section**.

#### Rules for Diagnosis Steps

* Binary questions (yes/no)
* Observable via dashboards or simple commands
* No Kubernetes internals unless unavoidable
* No “interpret this log” unless explicitly shown

#### Example Diagnosis Flow

```text
Step 1: Is traffic reaching the service?
→ Check Dashboard: "Ingress Requests"
- YES → Go to Step 2
- NO  → Go to Step 5

Step 2: Are error rates elevated?
→ Check Dashboard: "5xx Rate"
- YES → Step 3
- NO  → Likely transient, monitor for 5 minutes

Step 3: Is latency elevated?
→ Check Dashboard: "P95 Latency"
- YES → Step 4
- NO  → Escalate (unexpected error pattern)
```

🚫 **Never** say:

* “Investigate”
* “Debug”
* “Look into”

---

### 6. Resolution Procedures (Safe, Reversible Actions Only)

Tier 2 actions must be:

* **Idempotent**
* **Low risk**
* **Documented blast radius**

#### Structure for Each Action

```text
Action Name:
When to use:
What this does:
Steps:
Verification:
Rollback:
```

#### Example: Restarting a Deployment

```text
Action: Restart checkout-api deployment

When to use:
- Error rate >10%
- At least 2 replicas healthy

What this does:
- Forces pods to restart one at a time
- No user-visible downtime expected

Steps:
1. kubectl rollout restart deployment checkout-api
2. Wait for rollout to complete

Verification:
- Error rate drops below 2%
- All replicas ready

Rollback:
- None required (restart is reversible)
```

🚫 Do not allow:

* Scaling to zero
* Manual pod deletion without guardrails
* Config changes
* Database changes

---

### 7. Escalation Criteria (Very Explicit)

Tier 2 must **never guess** when to escalate.

**Good**

```text
Escalate to Tier 3 if:
- Error rate >10% for 10 minutes after restart
- Data integrity alerts fire
- Symptoms do not match this runbook
```

**Bad**

> “If the issue persists”

---

### 8. References & Links

* Dashboards
* Alerts
* Architecture diagrams
* Related runbooks

---

# 4. Writing for Non-Developers (Key Techniques)

### Use Concrete Language

* “Click the dashboard named X”
* “Look for the red line crossing 5%”
* “Run this exact command”

### Avoid:

* Kubernetes theory
* Acronyms without explanation
* “Should”, “might”, “probably”

### Provide Expected Outcomes

Always say:

> “If this works, you should see…”

---

# 5. Identifying What Runbooks You Need

Start from **failure patterns**, not services.

## 5.1 Core Runbook Categories

### Infrastructure / Platform

* Pod crash loops
* Node not ready
* Image pull failures
* Service mesh sidecar failures

### Traffic & Scaling

* High latency
* High error rates
* Autoscaling not triggering
* Traffic stuck on old version (blue/green)

### Dependency Failures

* Database unavailable
* Timeout to external APIs
* Credential/secret expiration

### Deployment Issues

* Rollout stuck
* Readiness probes failing
* Version mismatch across services

👉 **Rule of thumb**:
If an alert pages Tier 2 → it **must** have a runbook.

---

# 6. Linking Runbooks to Alerts & Dashboards

### Alert Design Rule

**No alert without a runbook link.**

Alert payload should include:

* Summary
* Impact
* Link to runbook
* Link to dashboard

**Example**

```text
ALERT: checkout-api 5xx rate >5%

Runbook: https://runbooks/checkout/high-error-rate
Dashboard: https://dashboards/checkout/overview
```

---

# 7. Good vs Bad Runbook Examples

### ❌ Bad

> “Check logs and restart pods if needed.”

Why it fails:

* No criteria
* No safety
* No escalation guidance
* Encourages random actions

---

### ✅ Good

> “If error rate >5% and at least 2 pods are ready, restart deployment.
> If error rate persists after 10 minutes, escalate.”

---

# 8. Testing Runbooks with Tier 2 (Mandatory Practice)

## 8.1 Runbook Fire Drills

* Use staging
* Inject failure (kill pods, block DB, scale down nodes)
* Tier 2 follows runbook **without help**
* Observe confusion points

## 8.2 Post-Drill Review

Ask:

* Where did they hesitate?
* What terms were unclear?
* What decisions felt unsafe?

Update immediately.

---

# 9. Maintaining Runbooks After Incidents

### After Every Tier 3 Escalation:

Ask:

1. Could Tier 2 have resolved this?
2. Was a runbook missing?
3. Was the escalation criteria unclear?

**Rule**:
If Tier 3 touches it twice → Tier 2 needs a runbook update.

---

# 10. Operations Handbook (The “Front Door”)

This is not a runbook—it’s orientation.

## Contents

* System overview (C4-style diagram)
* Environments & promotion flow
* What Tier 2 can and cannot do
* How incidents are classified
* Where runbooks live
* Escalation paths

Think of it as **“How to operate this platform”**, not “How it works.”

---

# 11. Runbook Templates

## 11.1 Incident Response Runbook Template

```markdown
# Runbook: <Title>

## Trigger
## Impact
## Normal Conditions
## Diagnosis
## Resolution
## Escalation
## References
```

## 11.2 Deployment Issue Runbook

```markdown
## Trigger
## Expected Deployment Behavior
## Common Failure Modes
## Safe Actions
## Escalation Criteria
```

---

# 12. Runbook Quality Checklist

A runbook is **acceptable** only if:

* [ ] Trigger is explicit
* [ ] Impact is described in business terms
* [ ] Diagnosis is step-by-step and observable
* [ ] All actions are safe and reversible
* [ ] Escalation criteria are explicit
* [ ] Linked from alerts
* [ ] Tested by Tier 2
* [ ] Owned and reviewed regularly

---

## Final Advice

Your biggest architectural win will not be:

* Autoscaling
* Service mesh
* Blue/green deployments

It will be **turning distributed system chaos into predictable Tier 2 actions**.
