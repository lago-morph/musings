# ADR: One JSON file per node with edges declared at both endpoints

- **ID**: ADR-16fc2c85a2
- **Status**: Draft (not yet adopted to docs/adr/)
- **Date**: 2026-07-05
- **Source retrospective**: ../2026-07-05-1.md
- **PRs covered**: #1

## Context

The early-LLM tutorial is a directed graph of ~20 content nodes whose edges (prerequisite / contrast / leads-to) drive both navigation and narrative. The content is authored and revised by fleets of parallel subagents, none of which sees the whole graph, and the original spec left the storage format open ("inline JS object literals vs. a small build from Markdown/JSON"). The reviewer directed one-file-per-node with edges in both connected files and a CI check; this ADR records the resulting shape and why the redundancy is load-bearing rather than waste.

## Decision

Store the tutorial graph as one schema-validated JSON file per node, duplicate every edge verbatim in both endpoint files, and make CI fail unless the two copies are byte-identical.

Concretely: `nodes/NN-<id>.json` validated by `schema/node.schema.json` (draft 2020-12); each node's `edges[]` copied verbatim from the canonical blocks in `authoring/node-graph.md`; `ci/lint_nodes.mjs` (Node 22 + ajv 2020 build) enforces schema validity, edge bidirectionality, no dangling endpoints/self-loops/duplicate ids, contrast-edge orientation (lexicographically smaller id as `from`), SVG-path existence, and advisory word-count/diagram-ratio checks.

## Alternatives considered

- **Single edges manifest (edges in one file, nodes reference nothing)** — no redundancy to check, but every subagent authoring a node would need the manifest in scope to know its neighbors, and a node file alone would not be self-describing for the v2 "agent consumes one node" use case. Rejected: per-node self-containedness is a design goal (SPEC §10).
- **Edges declared on one endpoint only (e.g. on `from`)** — halves the writing, but a reader/agent of the `to` node cannot see its incoming prerequisites without a global scan, and there is no redundancy for CI to catch corruption against. Rejected.
- **Inline JS object literals in one HTML file (the spec's original sketch)** — no per-file validation possible, unmergeable diffs across 22 parallel agent runs, and forecloses the structured-repo path. Rejected by the reviewer's direction.

## Consequences

Easier: parallel authoring (11 agents twice over produced 27 edges across 20 files with zero mismatches, because they copied canonical blocks and CI compared bytes); trustworthy graph rendering (the prototype builds navigation straight from `edges[]`); per-node review diffs. Harder: every edge change touches three places (canonical map + two node files) — accepted, since the linter makes a partial update impossible to merge; the graph's shape lives redundantly and `authoring/node-graph.md` must remain the acknowledged source of truth for structural changes.

## References

- [`../2026-07-05-1.md`](../2026-07-05-1.md) — the source retrospective.
- [`./SKILL-SPEC-be1e7dd0a9-briefed-fanout-authoring.md`](./SKILL-SPEC-be1e7dd0a9-briefed-fanout-authoring.md) — the fan-out method this format enables.
- PRs the decision was made in: #1.
