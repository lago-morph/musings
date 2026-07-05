# agent instruction

**Ship GitHub Actions workflows as plain repo files when the push token lacks workflow scope.** "If a git push is rejected with "refusing to allow an OAuth App to create or update workflow ... without workflow scope", do not retry or force. Move the workflow YAML out of .github/workflows/ into a normal repo path (e.g. ci/github-workflow-<name>.yml), push, and document a one-time activation step (copy into .github/workflows/ and push) for a maintainer whose credentials carry the scope."

*Grounded in: PR #1's first push being rejected solely because of .github/workflows/early-llm-lint.yml.*

# justification

An entire content commit was blocked because one file lived under .github/workflows/. The GitHub MCP fallback (create_or_update_file) also failed — the app lacked contents-write. The plain-file-plus-README-activation pattern unblocked the push in minutes, preserved the workflow verbatim for the maintainer, and cost only a documented copy step. Without the rule, the obvious moves — retrying, amending, force-pushing, or silently dropping CI — either waste time or lose the workflow.
