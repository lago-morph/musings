# Session Bootstrap (Read This First)

Use this file to quickly restore context in a new chat session without re-explaining the project.

## 0) Session Gate (must do before anything else)

1. State:
   - Your model name (if available in this environment)
   - Your training cutoff date
2. If your training cutoff is **before 2025-08** (Crossplane v2.0 release), stop and ask the user to switch models.

## 0.1) Tooling Diagnostic (Codex CLI `workdir` caveat)

In this environment, the shell tool may ignore the requested working directory and default to `/home/jonathan`, which can cause accidental reads of home-directory files.

Before reading anything, run:
- `pwd`
- `cd /home/jonathan/src/musings/tutorials/crossplane/xrds && pwd`

If `pwd` does not show the expected repo path, **always** prefix shell commands with:
- `cd /home/jonathan/src/musings/tutorials/crossplane/xrds && ...`

Do not assume `workdir` is honored even if provided by the harness.

## 1) Mandatory Reading Order (do not skip)

Read these files in order, then provide a short “current state” summary.

### A) Steering (process + safety rules)
1. `.kiro/steering/AGENTS.md`
2. `.kiro/steering/critical-workflow-rules.md`
3. `.kiro/steering/tut-flow-mods.md`

### B) Crossplane v2 reference (treat as source of truth over memory)
4. `.kiro/reference/crossplane/index.md`
5. `.kiro/reference/crossplane/danger-checklist.md`
6. `.kiro/reference/crossplane/mental-models.md`
7. `.kiro/reference/crossplane/api-versions/README.md`
8. `.kiro/reference/crossplane/api-versions/current.md`
9. `.kiro/reference/crossplane/api-versions/links.md`

### C) Tutorial phase context (where we are now)
10. `.kiro/specs/xrd-tutorial/phase3-tasks.md`
11. `.kiro/specs/xrd-tutorial/tutorial-specification.md`

## 2) Hard Rules to Apply After Reading

- **Assume Crossplane v1 knowledge is wrong.** Do not propose v1 patterns (Claims/`claimNames`, Resources mode, old patch syntax, `ControllerConfig`, `.crossplane.io` API groups, provider-kubernetes Objects, etc.).
- **Default to v2 mental model:** direct XRs, Pipeline mode, composition Functions, namespaced-by-default, `.m.crossplane.io` MRs, and v2.1 API versions from `current.md`.
- **File reading discipline:** after the reading list above, do not read any additional files unless the user explicitly approves.
- **Workflow discipline:** do not start tasks, mark tasks complete, or commit without explicit user instruction/approval.

## 3) What to Output After Bootstrapping

Provide:
- A 5–10 bullet “where we are” summary (Phase 3 status, what’s complete vs pending).
- A short list of “next candidate tasks” and ask which one to start.
