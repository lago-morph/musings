---
title: "Schema Validation with Layered Values Files"
summary: "Schema Validation with Layered Values Files is a infrastructure document covering Schema Validation with Layered Values Files and **The Core Challenge**. This resource provides information and guidance on the topic. See the full document for detailed information and implementation details."
keywords:
  - "yaml"
  - "platform"
  - "database"
  - "helm"
  - "json"
  - "deployment"
  - "production"
  - "api"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
---

# Schema Validation with Layered Values Files

Great question! This is a **real-world pattern** that many organizations use, and it fundamentally changes how you approach schema validation.

## **The Core Challenge**

Your setup is:
```
values.yaml (base defaults) 
  + platform.yaml (environment/platform overrides)
  + custom-values.yaml (deployment-specific overrides)
  = final merged values
```

The problem: **Helm validates the schema against the MERGED result, not individual files.**

This means:
- If `database.password` is required but intentionally omitted from `values.yaml`
- Your schema validation will PASS when you provide `-f values.yaml -f platform.yaml`
- But will FAIL when someone tests with just `values.yaml` alone
- This breaks local development, testing, and chart packaging

## **How Helm Schema Validation Actually Works**

When you run:
```bash
helm install app . -f values.yaml -f platform.yaml -f custom.yaml
```

Helm does this:
1. Merges all value files (left to right, later values override earlier)
2. Validates the **final merged result** against `values.schema.json`
3. Then renders templates

**Key insight:** The schema sees ONE combined values object, not individual layers.

---

## **Impact on What I Showed You**

### Problem 1: Required Fields Break Packaging

If your schema has:
[EXAMPLE-1: Schema marking database.password as required]

Then this fails:
```bash
helm template . -f values.yaml
# Error: database.password is required
```

Even though you INTEND to provide it via platform.yaml later. This breaks:
- Chart Museum publishing (validates with just values.yaml)
- `helm lint` (checks values.yaml in isolation)
- Developer local testing before they have platform.yaml

### Problem 2: Can't Validate Individual Layers

You can't create separate schemas for each layer because:
- Helm only uses ONE schema file: `values.schema.json`
- There's no `platform.schema.json` or layered validation
- You can't tell Helm "these fields are required in the final merge but optional in base"

### Problem 3: Conditional Requirements Based on Source

What you want: "database.password is optional in values.yaml but required in the final deployment"

What JSON Schema can express: "database.password is required (period)" OR "database.password is optional (period)"

There's no concept of "required depending on which file it came from."

---

## **Solution Strategies**

### Strategy 1: Schema for Final State Only (Recommended)

**Approach:** Schema validates what production MUST have, not what values.yaml contains.

Your `values.yaml` contains:
[EXAMPLE-2: values.yaml with intentionally empty database section]

Your `platform.yaml` contains:
[EXAMPLE-3: platform.yaml with actual database credentials]

Your `values.schema.json` marks `database.password` as **required**.

**Implications:**
- ❌ `helm template . -f values.yaml` fails validation
- ✅ `helm template . -f values.yaml -f platform.yaml` passes
- ✅ Production deployments are validated correctly
- ❌ Chart packaging/publishing requires workarounds

**Workaround for packaging:**
[EXAMPLE-4: CI script that provides minimal platform.yaml for validation]

---

### Strategy 2: Everything Optional in Schema, Validate in Templates

**Approach:** Make everything optional in schema, add validation logic in Helm templates.

Your `values.schema.json`:
[EXAMPLE-5: Schema with all database fields optional]

Your template adds validation:
[EXAMPLE-6: Deployment template with required field checks]

**Implications:**
- ✅ Chart packages/lints successfully with just values.yaml
- ✅ Validation happens at render time with merged values
- ✅ Clear error messages about missing required fields
- ❌ Less "shift-left" - errors caught later in process
- ❌ More verbose templates

---

### Strategy 3: Hybrid Approach with Different Validation Contexts

**Approach:** Use schema for structure/types, use templates for requirements.

Schema validates:
- Data types (string, integer, boolean)
- Formats (email, hostname, port ranges)
- Enums (allowed values)
- Patterns (regex validation)

Templates validate:
- Required fields (since these depend on deployment context)
- Cross-field dependencies
- Environment-specific rules

**Implications:**
- ✅ Best of both worlds
- ✅ Schema catches type errors early
- ✅ Templates catch missing required fields at deploy time
- ✅ Works with layered values
- ⚠️ Split validation logic across two places

---

### Strategy 4: Multiple Schema Files with Manual Testing

**Approach:** Create different schema files for different purposes, manually select which to use.

Files:
- `values.schema.json` (minimal, for base values.yaml)
- `schemas/production.schema.json` (strict, for production)
- `schemas/development.schema.json` (relaxed, for dev)

You manually test against appropriate schema:
[EXAMPLE-7: Script that validates against different schemas]

**Implications:**
- ✅ Flexible per-environment validation
- ❌ Helm only uses `values.schema.json` automatically
- ❌ Must remember to run manual validation
- ❌ More maintenance burden
- ⚠️ Easy to forget which schema to use when

---

## **Testing with Layered Values**

### Unit Tests (helm-unittest)

Your test files can specify multiple value files:
[EXAMPLE-8: unittest with layered values]

**Key point:** Tests see the merged result, just like Helm does.

### Integration Tests (chart-testing)

The `ct` tool follows the same merge behavior:
[EXAMPLE-9: ct test with multiple values files]

### Manual Validation

You need to test the full merge:
[EXAMPLE-10: Manual validation commands]

---

## **What You Can't Do (JSON Schema Limitations)**

1. **Can't mark fields as "required in layer N but optional in layer 1"**
   - JSON Schema has no concept of file provenance
   - It only sees the final merged object

2. **Can't validate "at least one of these files must provide field X"**
   - No way to track which file provided which value
   - Can only validate the final result

3. **Can't have conditional requirements based on deployment environment**
   - Schema is static, doesn't know if you're deploying to dev/staging/prod
   - Can use conditionals based on VALUES, but not based on CONTEXT

4. **Can't enforce "this field must come from platform.yaml, not values.yaml"**
   - No file-source tracking
   - Can't prevent users from putting secrets in wrong file

---

## **Best Practices for Layered Values**

### Practice 1: Document Intent in Comments

In your `values.yaml`:
[EXAMPLE-11: values.yaml with documentation comments]

### Practice 2: Use Sentinel Values

Instead of omitting required fields, use sentinel values:
[EXAMPLE-12: Using sentinel values like REQUIRED or OVERRIDE_ME]

Your schema can then validate:

[EXAMPLE-13: Schema pattern matching for sentinel values]
**this example is at the end of the document with some additional explanation**

This gives early feedback: "You forgot to override this required field"

### Practice 3: Validation Hooks

Use Helm hooks to validate before deployment:
[EXAMPLE-14: PreInstall hook that validates required fields]

### Practice 4: Separate Required vs. Optional in Schema Organization

Structure your schema to make the layering visible:
[EXAMPLE-15: Schema with comments showing which fields expect platform.yaml]

---

## **Recommended Approach for Your Use Case**

Based on your layered setup, I recommend:

**For values.schema.json:**
- Validate types, formats, enums, patterns
- Make "will be provided by platform.yaml" fields **optional**
- Use `pattern` to catch sentinel values if you use them

**For templates:**
- Add explicit required field checks for production-critical values
- Provide helpful error messages referencing which layer should provide the value

**For CI/CD:**
- Lint/test with merged values (values.yaml + platform.yaml)
- Run separate validation for each environment's platform file

**For documentation:**
- Clearly document which values.yaml fields are "placeholders"
- Document which platform.yaml fields are required
- Provide example platform.yaml for each environment

---

## **Detection and Warnings**

You can add warnings for common mistakes:

### Warn if Required Field Uses Default

Template logic to detect if production is using a dev default:
[EXAMPLE-16: Template warning when production uses development defaults]

### Fail Fast on Missing Critical Fields

PreInstall hook that checks critical fields:
[EXAMPLE-17: Hook that validates before any resources are created]

---

## **The Uncomfortable Truth**

Helm's schema validation wasn't designed for layered values files. It assumes:
- One canonical `values.yaml`
- All required fields present in that file
- Overrides are for customization, not completion

Your pattern (intentionally incomplete base + required overrides) is valid and common, but fights against Helm's assumptions.

**The workaround is accepting that:**
- Schema validates final merged state
- You need template-level validation for context-dependent requirements
- Your CI/CD must always test with full value layers
- Chart packaging requires either minimal platform.yaml or template validation only

---

## **Questions to Clarify Your Needs**

Before I provide specific examples, tell me:

1. **What's your primary concern?**
   - Chart packaging/publishing failing validation?
   - Developer experience when testing locally?
   - Catching production deployment errors earlier?
   - All of the above?

2. **What fields are intentionally missing from values.yaml?**
   - Just secrets (passwords, API keys)?
   - Environment-specific config (URLs, database hosts)?
   - Scaling parameters (replicas, resources)?

3. **How many layers do you have?**
   - Just values.yaml + platform.yaml?
   - Or values.yaml + platform.yaml + environment.yaml + custom.yaml?

4. **Who controls which layer?**
   - Platform team controls platform.yaml?
   - Developers never see/edit platform.yaml?
   - Each team has their own overrides?

5. **What's your deployment pattern?**
   - ArgoCD with values files in different repos?
   - Helm directly with `-f` flags?
   - Helmfile managing the layers?

Let me know which examples you want to see numbered EXAMPLE-1 through EXAMPLE-17, and I'll provide them based on your specific context.

# EXAMPLE-13: Schema Pattern Matching for Sentinel Values

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "database": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string",
          "not": {
            "pattern": "^(REQUIRED|OVERRIDE_ME|CHANGEME|TODO)$"
          },
          "description": "Database hostname - must be overridden in platform.yaml"
        },
        "password": {
          "type": "string",
          "not": {
            "pattern": "^(REQUIRED|OVERRIDE_ME|CHANGEME|TODO|changeme|password)$"
          },
          "minLength": 8,
          "description": "Database password - must be overridden in platform.yaml"
        },
        "port": {
          "type": "integer",
          "minimum": 1,
          "maximum": 65535,
          "not": {
            "const": 0
          }
        }
      }
    },
    "apiKey": {
      "type": "string",
      "not": {
        "pattern": "^(REQUIRED|OVERRIDE_ME|CHANGEME|TODO|your-api-key-here)$"
      },
      "pattern": "^[a-zA-Z0-9_-]{32,}$",
      "description": "API key for external service - must be real value in platform.yaml"
    },
    "externalUrl": {
      "type": "string",
      "format": "uri",
      "not": {
        "pattern": "^(REQUIRED|OVERRIDE_ME|https://example\\.com)$"
      },
      "description": "External URL - must be overridden for environment"
    }
  }
}
```

**How this works:**

1. **The `not` keyword** - JSON Schema validates that the value does NOT match the pattern/const inside the `not` block

2. **Pattern matching** - Catches common sentinel values:
   - `REQUIRED`
   - `OVERRIDE_ME`
   - `CHANGEME`
   - `TODO`
   - Common weak passwords like `password` or `changeme`

3. **Validation behavior:**
   ```bash
   # ❌ This FAILS validation
   helm install app . \
     --set database.password=REQUIRED
   # Error: database.password must not match pattern ^(REQUIRED|OVERRIDE_ME|...)$
   
   # ❌ This also FAILS
   helm install app . \
     --set database.password=changeme
   # Error: database.password must not match pattern
   
   # ✅ This PASSES
   helm install app . \
     --set database.password=actualSecurePassword123
   ```

4. **Additional validations combined:**
   - `database.password` must NOT be a sentinel value
   - AND must be at least 8 characters (`minLength: 8`)
   - Both conditions must be true

5. **For URLs:**
   ```json
   "not": {
     "pattern": "^(REQUIRED|OVERRIDE_ME|https://example\\.com)$"
   }
   ```
   This prevents both sentinel values AND the common documentation placeholder `https://example.com`

**Corresponding values.yaml would look like:**
```yaml
database:
  host: OVERRIDE_ME  # Will fail validation if not overridden
  password: REQUIRED # Will fail validation if not overridden
  port: 5432         # Valid default, can be used as-is

apiKey: REQUIRED     # Will fail validation if not overridden

externalUrl: https://example.com  # Will fail validation if not overridden
```

**And platform.yaml provides real values:**
```yaml
database:
  host: prod-db.internal.company.com
  password: actualDatabasePassword
  # port inherits 5432 from values.yaml

apiKey: ak_live_abc123def456ghi789jkl012mno345pqr

externalUrl: https://api.production.company.com
```

**Result:**
- Chart packages/lints successfully (sentinel values are valid strings)
- Deployment with just values.yaml FAILS validation (sentinel values detected)
- Deployment with values.yaml + platform.yaml PASSES (real values provided)

This gives you early feedback that required overrides are missing, without making the fields truly "required" in the schema (which would break packaging).

