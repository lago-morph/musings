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
- [ ] Author remaining 19 node JSON files via briefed subagents (with diagram prompts)
- [ ] Reconcile cross-node references; ensure all `edges[]` copied verbatim from `node-graph.md`
- [ ] Linter green across all nodes; commit + push

### Phase 3 — Diagrams (SVG)
- [ ] Hand-build a simple SVG for every diagram (structural = precise; conceptual = placeholder)
- [ ] Wire `svg` paths into each node; linter green; commit + push

### Phase 4 — UI prototype
- [ ] `prototypes/ui-prototype.html` — toggleable intro + iPad-nav options, KaTeX, inline SVGs,
      tap-to-reveal diagram-prompt popup; wire in 2–3 real nodes
- [ ] Commit + push; open PR; reviewer tries on iPad; iterate

### Phase 5 — Image-generation handoff
- [ ] Finalize `authoring/image-generation-agent.md` (clone → extract prompts → prepend style →
      generate → store under `diagrams/generated/...` → write paths back). Generation itself is a
      later, separate session.

---

## Progress log

- 2026-06-13: Phase 1 foundations authored (schema, briefs, style bible, node-graph, linter, CI).
  Exemplar node + SVGs in progress.
