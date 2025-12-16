---
title: "Quick Start: Generate Schema from Existing values.yaml"
summary: "Creating a Helm Values Schema: Complete Guide is a infrastructure document covering Creating a Helm Values Schema: Complete Guide and **Quick Start: Generate Schema from Existing values.yaml**. This resource provides information and guidance on the topic. See the full document for detailed information and implementation details."
keywords:
  - "helm"
  - "json"
  - "yaml"
  - "container"
  - "production"
  - "deployment"
  - "kubernetes"
  - "database"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
---

# Creating a Helm Values Schema: Complete Guide

The values schema (`values.schema.json`) is a **JSON Schema** that validates your `values.yaml`. It catches mistakes **before** deployment.

---

## **Quick Start: Generate Schema from Existing values.yaml**

### Method 1: Using `helm-schema` (Fastest)

```bash
# Install
npm install -g @bitnami/helm-schema

# Generate schema
helm-schema generate values.yaml > values.schema.json

# Or for Go users
go install github.com/dadav/helm-schema/cmd/helm-schema@latest
helm-schema -input values.yaml -output values.schema.json
```

**This gives you 80% of what you need immediately.** Then you refine it.

---

### Method 2: Manual Creation (Full Control)

Let's say your `values.yaml` looks like this:

```yaml
# values.yaml
replicaCount: 1

image:
  repository: nginx
  tag: "1.21"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: nginx
  hosts:
    - host: chart-example.local
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 100
```

---

## **Building the Schema Step-by-Step**

### Step 1: Basic Structure

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "My App Helm Chart Values",
  "type": "object",
  "properties": {
    
  }
}
```

---

### Step 2: Simple Properties (Primitives)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "description": "Number of replicas to deploy"
    }
  }
}
```

**What this validates:**
```bash
# ✅ Valid
helm install my-app . --set replicaCount=3

# ❌ Invalid - not an integer
helm install my-app . --set replicaCount=1.5
# Error: values don't meet the specifications of the schema

# ❌ Invalid - out of range
helm install my-app . --set replicaCount=200
# Error: replicaCount must be <= 100
```

---

### Step 3: Nested Objects

```json
{
  "properties": {
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": {
          "type": "string",
          "minLength": 1,
          "description": "Container image repository"
        },
        "tag": {
          "type": "string",
          "pattern": "^[a-zA-Z0-9._-]+$",
          "description": "Container image tag"
        },
        "pullPolicy": {
          "type": "string",
          "enum": ["Always", "IfNotPresent", "Never"],
          "description": "Image pull policy"
        }
      }
    }
  }
}
```

**What this validates:**
```bash
# ✅ Valid
helm install my-app . \
  --set image.repository=myapp \
  --set image.tag=v1.0.0

# ❌ Invalid - missing required field
helm install my-app . --set image.repository=myapp
# Error: image requires property "tag"

# ❌ Invalid - invalid enum value
helm install my-app . --set image.pullPolicy=Sometimes
# Error: image.pullPolicy must be one of: Always, IfNotPresent, Never

# ❌ Invalid - invalid tag format
helm install my-app . --set image.tag="1.0.0 beta"
# Error: image.tag must match pattern ^[a-zA-Z0-9._-]+$
```

---

### Step 4: Arrays

```json
{
  "properties": {
    "ingress": {
      "type": "object",
      "properties": {
        "hosts": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["host"],
            "properties": {
              "host": {
                "type": "string",
                "format": "hostname",
                "description": "Hostname for ingress"
              },
              "paths": {
                "type": "array",
                "minItems": 1,
                "items": {
                  "type": "object",
                  "required": ["path", "pathType"],
                  "properties": {
                    "path": {
                      "type": "string",
                      "pattern": "^/",
                      "description": "URL path (must start with /)"
                    },
                    "pathType": {
                      "type": "string",
                      "enum": ["Exact", "Prefix", "ImplementationSpecific"]
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**What this validates:**
```bash
# ✅ Valid
helm install my-app . \
  --set 'ingress.hosts[0].host=example.com' \
  --set 'ingress.hosts[0].paths[0].path=/' \
  --set 'ingress.hosts[0].paths[0].pathType=Prefix'

# ❌ Invalid - path doesn't start with /
helm install my-app . \
  --set 'ingress.hosts[0].paths[0].path=api'
# Error: path must match pattern ^/

# ❌ Invalid - invalid pathType
helm install my-app . \
  --set 'ingress.hosts[0].paths[0].pathType=Wildcard'
# Error: pathType must be one of: Exact, Prefix, ImplementationSpecific
```

---

### Step 5: Conditional Validation (Advanced)

**Problem:** When autoscaling is enabled, `minReplicas` and `maxReplicas` should be required.

```json
{
  "properties": {
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
        "properties": {
          "enabled": { "const": true }
        }
      },
      "then": {
        "required": ["minReplicas", "maxReplicas"],
        "properties": {
          "maxReplicas": {
            "type": "integer",
            "minimum": { "$data": "1/minReplicas" }
          }
        }
      }
    }
  }
}
```

**What this validates:**
```bash
# ✅ Valid - autoscaling disabled, no replicas needed
helm install my-app . --set autoscaling.enabled=false

# ❌ Invalid - enabled but missing minReplicas
helm install my-app . \
  --set autoscaling.enabled=true \
  --set autoscaling.maxReplicas=10
# Error: when autoscaling.enabled=true, minReplicas is required

# ❌ Invalid - maxReplicas < minReplicas
helm install my-app . \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=10 \
  --set autoscaling.maxReplicas=5
# Error: maxReplicas must be >= minReplicas
```

---

### Step 6: Cross-Field Validation

**Problem:** When `ingress.enabled=true`, you must set `service.type=ClusterIP`

```json
{
  "properties": {
    "ingress": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" }
      }
    },
    "service": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["ClusterIP", "NodePort", "LoadBalancer"]
        }
      }
    }
  },
  "if": {
    "properties": {
      "ingress": {
        "properties": { "enabled": { "const": true } }
      }
    }
  },
  "then": {
    "properties": {
      "service": {
        "properties": {
          "type": {
            "const": "ClusterIP"
          }
        }
      }
    }
  }
}
```

---

## **Complete Real-World Example**

Here's a production-ready schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "My Application Helm Chart Values",
  "type": "object",
  "required": ["image"],
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 1,
      "description": "Number of pod replicas"
    },
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": {
          "type": "string",
          "minLength": 1,
          "description": "Container image repository",
          "examples": ["nginx", "myregistry.io/myapp"]
        },
        "tag": {
          "type": "string",
          "pattern": "^[a-zA-Z0-9._-]+$",
          "description": "Container image tag (no spaces allowed)"
        },
        "pullPolicy": {
          "type": "string",
          "enum": ["Always", "IfNotPresent", "Never"],
          "default": "IfNotPresent"
        }
      },
      "additionalProperties": false
    },
    "service": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"],
          "default": "ClusterIP"
        },
        "port": {
          "type": "integer",
          "minimum": 1,
          "maximum": 65535,
          "default": 80
        }
      }
    },
    "ingress": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": false
        },
        "className": {
          "type": "string",
          "description": "Ingress class name"
        },
        "annotations": {
          "type": "object",
          "additionalProperties": {
            "type": "string"
          }
        },
        "hosts": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "required": ["host"],
            "properties": {
              "host": {
                "type": "string",
                "format": "hostname"
              },
              "paths": {
                "type": "array",
                "minItems": 1,
                "items": {
                  "type": "object",
                  "required": ["path", "pathType"],
                  "properties": {
                    "path": {
                      "type": "string",
                      "pattern": "^/"
                    },
                    "pathType": {
                      "type": "string",
                      "enum": ["Exact", "Prefix", "ImplementationSpecific"]
                    }
                  }
                }
              }
            }
          }
        },
        "tls": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["secretName"],
            "properties": {
              "secretName": {
                "type": "string",
                "minLength": 1
              },
              "hosts": {
                "type": "array",
                "items": {
                  "type": "string",
                  "format": "hostname"
                }
              }
            }
          }
        }
      },
      "if": {
        "properties": { "enabled": { "const": true } }
      },
      "then": {
        "required": ["hosts"]
      }
    },
    "resources": {
      "type": "object",
      "properties": {
        "limits": {
          "type": "object",
          "properties": {
            "cpu": {
              "type": "string",
              "pattern": "^[0-9]+(m|[0-9])*$",
              "description": "CPU limit (e.g., 100m, 1, 2)"
            },
            "memory": {
              "type": "string",
              "pattern": "^[0-9]+(Mi|Gi|M|G)$",
              "description": "Memory limit (e.g., 128Mi, 1Gi)"
            }
          }
        },
        "requests": {
          "type": "object",
          "properties": {
            "cpu": {
              "type": "string",
              "pattern": "^[0-9]+(m|[0-9])*$"
            },
            "memory": {
              "type": "string",
              "pattern": "^[0-9]+(Mi|Gi|M|G)$"
            }
          }
        }
      }
    },
    "autoscaling": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": false
        },
        "minReplicas": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100
        },
        "maxReplicas": {
          "type": "integer",
          "minimum": 1,
          "maximum": 1000
        },
        "targetCPUUtilizationPercentage": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100
        }
      },
      "if": {
        "properties": { "enabled": { "const": true } }
      },
      "then": {
        "required": ["minReplicas", "maxReplicas"]
      }
    },
    "nodeSelector": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    },
    "tolerations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": { "type": "string" },
          "operator": {
            "type": "string",
            "enum": ["Exists", "Equal"]
          },
          "value": { "type": "string" },
          "effect": {
            "type": "string",
            "enum": ["NoSchedule", "PreferNoSchedule", "NoExecute"]
          }
        }
      }
    },
    "affinity": {
      "type": "object"
    }
  },
  "additionalProperties": false
}
```

---

## **Advanced Patterns**

### Pattern 1: OneOf (Mutually Exclusive Options)

**Use case:** Either use `existingSecret` OR provide `username`/`password`, but not both.

```json
{
  "properties": {
    "database": {
      "type": "object",
      "oneOf": [
        {
          "required": ["existingSecret"],
          "properties": {
            "existingSecret": {
              "type": "string",
              "minLength": 1
            }
          }
        },
        {
          "required": ["username", "password"],
          "properties": {
            "username": {
              "type": "string",
              "minLength": 1
            },
            "password": {
              "type": "string",
              "minLength": 8
            }
          }
        }
      ]
    }
  }
}
```

### Pattern 2: AnyOf (At Least One Required)

**Use case:** Must specify at least one of: `httpGet`, `exec`, or `tcpSocket` for liveness probe.

```json
{
  "properties": {
    "livenessProbe": {
      "type": "object",
      "anyOf": [
        { "required": ["httpGet"] },
        { "required": ["exec"] },
        { "required": ["tcpSocket"] }
      ],
      "properties": {
        "httpGet": {
          "type": "object",
          "required": ["path", "port"],
          "properties": {
            "path": { "type": "string" },
            "port": { "type": "integer" }
          }
        },
        "exec": {
          "type": "object",
          "required": ["command"],
          "properties": {
            "command": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        },
        "tcpSocket": {
          "type": "object",
          "required": ["port"],
          "properties": {
            "port": { "type": "integer" }
          }
        }
      }
    }
  }
}
```

### Pattern 3: AllOf (Multiple Constraints)

**Use case:** Production deployments must have both resource limits AND pod disruption budget.

```json
{
  "properties": {
    "environment": {
      "type": "string",
      "enum": ["dev", "staging", "production"]
    }
  },
  "allOf": [
    {
      "if": {
        "properties": { "environment": { "const": "production" } }
      },
      "then": {
        "required": ["resources"],
        "properties": {
          "resources": {
            "required": ["limits", "requests"]
          },
          "podDisruptionBudget": {
            "required": ["enabled"],
            "properties": {
              "enabled": { "const": true }
            }
          }
        }
      }
    }
  ]
}
```

---

## **Testing Your Schema**

### Manual Testing

```bash
# Test with valid values
helm install my-app . --dry-run

# Test with invalid values
helm install my-app . \
  --set replicaCount=1000 \
  --dry-run
# Expected: Error about replicaCount max value

# Test missing required fields
helm install my-app . \
  --set image.repository=nginx \
  --dry-run  # Missing image.tag
# Expected: Error about required field
```

### Automated Testing

```bash
# Create test values files
cat > test-values/valid.yaml <<EOF
image:
  repository: nginx
  tag: "1.21"
replicaCount: 3
EOF

cat > test-values/invalid-replicas.yaml <<EOF
image:
  repository: nginx
  tag: "1.21"
replicaCount: 200  # Exceeds maximum
EOF

cat > test-values/invalid-missing-tag.yaml <<EOF
image:
  repository: nginx
  # Missing required tag field
EOF
```

**Test script:**
```bash
#!/bin/bash
set -e

echo "Testing valid values..."
helm template my-app . -f test-values/valid.yaml > /dev/null
echo "✓ Valid values passed"

echo "Testing invalid replica count..."
if helm template my-app . -f test-values/invalid-replicas.yaml 2>&1 | grep -q "values don't meet"; then
  echo "✓ Invalid replicas correctly rejected"
else
  echo "✗ Invalid replicas should have been rejected"
  exit 1
fi

echo "Testing missing required field..."
if helm template my-app . -f test-values/invalid-missing-tag.yaml 2>&1 | grep -q "required"; then
  echo "✓ Missing tag correctly rejected"
else
  echo "✗ Missing tag should have been rejected"
  exit 1
fi

echo "All schema tests passed!"
```

---

## **Common Gotchas**

### 1. **JSON vs YAML Types**

```json
// ❌ WRONG - This is YAML null, not JSON null
{
  "default": null
}

// ✅ CORRECT - Omit the default or use a valid value
{
  "type": "object"
}
```

### 2. **Pattern Anchoring**

```json
// ❌ WRONG - Matches "abc123def"
{
  "pattern": "[0-9]+"
}

// ✅ CORRECT - Only matches pure numbers
{
  "pattern": "^[0-9]+$"
}
```

### 3. **Resource Quantity Validation**

```json
// ❌ WRONG - "500" is valid, "500m" is not
{
  "type": "integer"
}

// ✅ CORRECT - Accepts both "500m" and "1"
{
  "type": "string",
  "pattern": "^[0-9]+(m|[0-9])*$"
}
```

### 4. **Empty Arrays**

```json
// ❌ Allows empty array
{
  "type": "array"
}

// ✅ Requires at least one item
{
  "type": "array",
  "minItems": 1
}
```

---

## **Quick Reference: Common Validations**

```json
{
  "properties": {
    // String with length constraints
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 63
    },
    
    // Email format
    "email": {
      "type": "string",
      "format": "email"
    },
    
    // Hostname format
    "host": {
      "type": "string",
      "format": "hostname"
    },
    
    // Integer with range
    "port": {
      "type": "integer",
      "minimum": 1,
      "maximum": 65535
    },
    
    // Enum (limited choices)
    "logLevel": {
      "type": "string",
      "enum": ["debug", "info", "warn", "error"]
    },
    
    // Boolean
    "enabled": {
      "type": "boolean",
      "default": false
    },
    
    // URL
    "webhookUrl": {
      "type": "string",
      "format": "uri",
      "pattern": "^https://"
    },
    
    // Kubernetes resource quantity
    "memory": {
      "type": "string",
      "pattern": "^[0-9]+(Mi|Gi|M|G|Ki|K|Ti|T|Pi|P|Ei|E)$"
    },
    
    // Duration
    "timeout": {
      "type": "string",
      "pattern": "^[0-9]+(s|m|h)$"
    }
  }
}
```

---

## **Your Action Plan**

1. **Today:** Generate initial schema with `helm-schema`
2. **This week:** Add validation for top 5 most critical values
3. **This month:** Add conditional validation and cross-field rules
4. **Ongoing:** Update schema whenever you change `values.yaml`

Start simple, iterate based on real bugs you find!
