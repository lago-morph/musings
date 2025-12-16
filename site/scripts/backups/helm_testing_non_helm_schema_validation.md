Yes, there are several tools that can validate Kubernetes manifests independently of Helm:

**kubeval** - Validates Kubernetes configuration files against the expected schema. Works with individual files or directories. It's standalone and doesn't require a cluster.

**kubeconform** - A faster, more modern alternative to kubeval. Supports newer Kubernetes versions and CRDs. Can validate multiple files and supports schema customization.

**kube-score** - Goes beyond basic schema validation to perform static analysis and best practice checks. It validates syntax but also flags potential issues like missing resource limits, security contexts, etc.

**kubectl --dry-run** - While technically part of kubectl, you can use `kubectl apply --dry-run=client -f manifest.yaml` or `kubectl apply --dry-run=server -f manifest.yaml` to validate without applying. The server option validates against your cluster's actual API.

**Datree** - A policy enforcement tool that includes schema validation plus custom policy checks. Can run in CI/CD pipelines.

**Pluto** - Specifically checks for deprecated API versions, which is useful when upgrading Kubernetes versions.

All of these work with both single manifest files and merged/multi-document YAML files. **kubeconform** is generally recommended as the most actively maintained option with the best performance and features.
