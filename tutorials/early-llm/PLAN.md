# Build Plan & Task Tracker — Early-LLM Tutorial Expansion

**Branch:** `claude/early-llm-tutorial-expansion-99tnw8`
**Living document:** updated as tasks complete. Status markers: `[ ]` not started · `🔄` in
progress · `✅` complete.

This plan implements the changes requested on 2026-06-13 to the design in `SPEC.md`.

---

## Decisions locked in this round

- **Word budget:** ~20,000 words total (double the spec's 8–10k), across the existing ~20-node
  graph, **deepened in place** (nodes get richer; graph structure unchanged). Concept nodes
  ~1,200–1,500 words; intro/contrast/SFT-bridge ~600–900.
- **Diagram-to-word ratio:** ~1 diagram per ~800 words, held roughly constant *when it makes
  sense* → ~24–28 diagrams total. Linter flags drift (advisory).
- **Authoring format:** one JSON file per node in `nodes/`, valid against `schema/node.schema.json`.
- **Edges:** declared identically on **both** endpoint files; copied verbatim from
  `authoring/node-graph.md`. CI linter enforces bidirectional consistency.
- **Diagram prompts** live in the node JSON (content-only). The **whiteboard** style is defined once
  in `authoring/diagram-style.md` and prepended by the image agent.
- **CI tooling:** Node 22 + ajv (`ci/lint_nodes.mjs`, `.github/workflows/early-llm-lint.yml`).
- **Diagrams:** I hand-build a simple SVG for every diagram (authoritative for structural ones;
  placeholder for conceptual). Image generation is a later, separate pass by another agent.
- **UI prototype:** one self-contained `prototypes/ui-prototype.html` with live-toggleable options
  for the intro landing and iPad navigation; real KaTeX math, inline SVGs, tap-a-diagram popup
  showing the diagram's prompt (dismiss via × or outside click). Iterated on the reviewer's iPad.
- **No checkpoint after foundations** — run straight through; this file is the running record.

## Recommendations I'm proceeding on (reviewer said "I take your recommendation on everything else")

- Intro landing: **hybrid** (brief orientation that folds into the map).
- iPad navigation: **bottom tab bar + slide-up map drawer**.
- Subagents: Opus for math-dense core nodes + structural SVGs; Sonnet for prehistory/training/
  contrast/intro/SFT + conceptual SVGs. All receive `voice-and-audience.md`, `diagram-style.md`,
  and `node-graph.md` verbatim.

---

## Task list

### Phase 1 — Foundations
- ✅ Directory scaffold (`schema/ authoring/ nodes/ diagrams/{svg,generated}/ ci/`)
- ✅ `schema/node.schema.json` — formal node schema
- ✅ `authoring/voice-and-audience.md` — shared audience + voice brief
- ✅ `authoring/diagram-style.md` — whiteboard style bible (single source of visual truth)
- ✅ `authoring/node-graph.md` — canonical node list + edge map (verbatim edge blocks)
- ✅ `ci/lint_nodes.mjs` + `ci/package.json` — schema + edge-consistency linter
- ✅ `.github/workflows/early-llm-lint.yml` — CI workflow
- ✅ Exemplar node `scaled-dot-product-attention` + its two SVGs (voice/depth/style calibration)
- ✅ `authoring/image-generation-agent.md` — brief for the separate image-generation agent
- ✅ `README.md` (directory orientation) + `SPEC.md` updates to reflect locked decisions
- ✅ Linter proven (schema, bidirectional edges, word/ratio checks); exemplar clean apart from the
      expected "missing endpoint" notices that resolve once all nodes exist. Phase 1 committed.

### Phase 2 — Content authoring (subagents)
- ✅ Authored remaining 19 node JSON files via 11 briefed subagents (Opus: 05,07,08,09,10,15,16,18;
      Sonnet: 01,02,03,04,11,12,13,14,17,19,20), each with diagram prompts
- ✅ Reconciled cross-node references; all `edges[]` copied verbatim from `node-graph.md`
- ✅ Linter GREEN across all 20 nodes: 0 errors, 0 warnings (schema + 27 bidirectional edges).
      Total prose ≈ 22,960 words (target ~20k; 11/12 run slightly tight, left unpadded as total is met).

### Phase 3 — Diagrams (SVG)
- ✅ Subagents hand-built a whiteboard SVG for every diagram (37 total) alongside their nodes;
      all `svg` paths wired in and resolving; all SVGs well-formed XML (xmllint clean).
- ◻ TODO: visual spot-review of agent-built SVGs for style consistency (do during prototype review).

### CI note
- ✅ Linter + workflow authored. Workflow shipped as `ci/github-workflow.early-llm-lint.yml`
      (plain file) because the OAuth token lacks GitHub `workflow` scope; README documents the
      one-time activation copy into `.github/workflows/`.

### Phase 4 — UI prototype
- ✅ `prototypes/build.mjs` — reproducible builder: inlines all 20 nodes + 37 SVGs into one
      self-contained HTML (re-run after editing nodes/SVGs).
- ✅ `prototypes/ui-prototype.html` (703 KB) — live-toggleable intro landing (hybrid / map-first /
      path-first) and iPad navigation (bottom tabs+drawer / swipe+overlay / slide-in rail) via a ⚙
      panel; real KaTeX math (CDN for the prototype), all whiteboard SVGs inline, and the
      tap-a-diagram → prompt popup (dismiss via × or outside click / Esc). Defaults = recommendations.
- 🔄 Commit + push; open PR; reviewer tries on iPad; iterate.

### Phase 5 — Image-generation handoff
- ✅ `authoring/image-generation-agent.md` brief complete (delivered in Phase 1). Actual image
      generation is a later, separate session.

### Phase 5 — Image-generation handoff
- [ ] Finalize `authoring/image-generation-agent.md` (clone → extract prompts → prepend style →
      generate → store under `diagrams/generated/...` → write paths back). Generation itself is a
      later, separate session.

---

## Progress log

- 2026-06-13: Phase 1 foundations authored (schema, briefs, style bible, node-graph, linter, CI).
  Exemplar node + SVGs in progress.
