# Spec: `briefed-fanout-authoring`

- **ID**: SKILL-SPEC-be1e7dd0a9
- **Source retrospective**: ../2026-07-05-1.md

## Intent

Produce or revise a large, multi-file body of content with many parallel subagents while keeping voice, notation, and cross-file invariants consistent. The method: author shared contract files first (audience/voice brief, style bible, canonical structure map with verbatim-copy blocks), calibrate with ONE exemplar the human reviewer approves, then fan out one brief per file-group with the contracts attached, and accept results only via machine validation (schema + invariant linter) and on-disk inspection — never via the subagents' own narration. In the source session this produced 20 schema-valid tutorial nodes whose 27 bidirectionally-declared edges were byte-identical across 22 independent agent runs, plus a full readability re-pass after reviewer feedback, with zero edge-consistency errors.

## Trigger

- Direct: "author all N chapters/nodes/pages", "use subagents to write the content", "revise every file to the new standard".
- Proactive: a content task spans ≥5 similar files that must share voice/notation, or would outlive one context window.
- Negative: single-document tasks; code refactors (different validators apply); tasks where the user has not yet approved the content direction at all.

## Inputs

- The content plan (file list, per-file scope, target lengths).
- Or, for a revision pass: the existing files plus the reviewer feedback that triggered the pass.
- A machine validator for the output format (JSON Schema, linter), or the mandate to build one first.

## Outputs

- `authoring/` contract files: audience+voice brief, style bible (if visual assets), canonical structure map with ready-to-paste verbatim blocks for any cross-file invariant.
- One approved exemplar file.
- All content files, validator-green.
- A living plan/tracker file updated as phases complete.

## Workflow

1. Write the contract files FIRST, in your own context: `voice-and-audience.md` (who the reader is, the voice, mandatory structure — including that orientation/on-ramps are NOT filler), the style bible, and a canonical map whose invariant blocks (e.g. per-node `edges[]` arrays) are written out verbatim, one copyable block per file.
2. Build/verify the validator: schema compliance plus a checker for every cross-file invariant (e.g. an edge must appear byte-identical in both endpoint files). Self-test it with a deliberately-broken pair before relying on it.
3. Author ONE exemplar yourself to full depth. **Stop and get the human reviewer's explicit approval of its voice, depth, and structure before any fan-out.** If the reviewer later changes the standard, update the brief + exemplar, re-approve, then re-run — never patch fleet output piecemeal.
4. Fan out subagents (group related files per agent; heavier model for the hardest files). Every brief contains, verbatim: the reading list (contracts + exemplar), the non-negotiables (format, notation, "copy invariant blocks verbatim from the map"), accurate per-file content anchors with real citations so nothing is invented, the validation command with expected residual noise described, and "modify only your assigned files; do not commit".
5. Integrate on hard evidence only: run the validator yourself, recompute declared metrics (word counts), spot-read files. Treat subagent narration ("file already existed", "another process committed it") as unreliable; ignore output from agents you did not launch.
6. To wait for a fleet, arm one background watch on a disk condition that means "all landed" (e.g. `grep -l <new-marker> files/*.json | wc -l` reaching N) instead of reacting per-completion; finalize in one pass: validate, rebuild derived artifacts, commit, update the tracker.

## Concrete examples

### Example 1: authoring 20 tutorial nodes

Contracts: `authoring/voice-and-audience.md`, `authoring/diagram-style.md`, `authoring/node-graph.md` (§3 = verbatim `edges[]` block per node). Validator: `ci/lint_nodes.mjs` (ajv 2020 + bidirectional edge check), self-tested with a deliberately mismatched aaa/bbb node pair. Exemplar: `nodes/06-scaled-dot-product-attention.json` + 2 SVGs. Fan-out: 11 agents (Opus for math-heavy nodes 05/07-10/15/16/18, Sonnet for the rest), briefs carried real sources ("Bahdanau arXiv:1409.0473… additive scoring a(s,h)=vᵀtanh(Ws+Uh)") to pin facts. Result: 20/20 schema-valid, 27 edges consistent, 0 errors — the "unknown node" lint notices during partial authoring were pre-declared in briefs as expected noise.

### Example 2: the readability re-pass

Reviewer verdict on pass 1: "unreadable … no entry point … worse than picking up a bunch of papers." Recovery per step 3: rewrote the brief (mandatory ~150-word on-ramp: where-we-are / gist / why-it-matters; inline `<figure data-dia>` anchors), rewrote the exemplar, got explicit approval ("Yes this is much better"), THEN re-dispatched 11 revision agents whose briefs said "rewrite `prose` only; do NOT change edges/diagrams/svg paths; keep facts; update wordCount honestly." Completion detected by one background watch on `grep -l 'figure data-dia' nodes/*.json` reaching 20; single finalize pass went lint-green.

## Anti-patterns

- **Fanning out before reviewer approval of an exemplar** — cost the source session a full 20-node rewrite.
- **Prose-level invariant instructions** ("make sure edges match") instead of verbatim-copy blocks + linter — coordination bugs across independent agents are near-certain.
- **Trusting completion narration** — agents mis-reported files as "pre-existing" and invented a "concurrent process"; one unlaunched stray agent returned prose that would have reverted approved content if applied.
- **Vague content briefs** ("write about BERT") — without pinned facts/citations, trustworthiness dies; briefs must carry the anchors.
- **Reacting to every agent completion** — churns context; watch one aggregate disk condition instead.

## Acceptance criteria

- [ ] Contract files + approved exemplar exist and predate all fan-out briefs.
- [ ] Validator covers schema AND each cross-file invariant, and was self-tested on a known-bad input.
- [ ] Final validator run is green over all files, executed by the orchestrator (not just claimed by subagents).
- [ ] Declared metrics (e.g. wordCount) match recomputed values.
- [ ] Any mid-pass standard change went brief → exemplar → re-approval → re-run, in that order.

## Files this skill creates / modifies

- `authoring/*.md` — the shared contracts (voice brief, style bible, canonical map).
- `<content-dir>/*` — the authored/revised content files.
- `ci/lint_*.mjs` (or equivalent) — the schema + invariant validator.
- `PLAN.md` — living tracker updated per phase.
