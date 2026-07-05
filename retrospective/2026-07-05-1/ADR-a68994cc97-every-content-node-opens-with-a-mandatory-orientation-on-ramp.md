# ADR: Every content node opens with a mandatory orientation on-ramp

- **ID**: ADR-a68994cc97
- **Status**: Draft (not yet adopted to docs/adr/)
- **Date**: 2026-07-05
- **Source retrospective**: ../2026-07-05-1.md
- **PRs covered**: #1

## Context

The first complete authoring pass (20 nodes, ~23k words) followed a brief that framed the reader as an expert needing "no hand-holding" and instructed authors to "earn every sentence." The reviewer's verdict: "The nodes start right into details with no introduction, grounding, relevance to other nodes. … there is no entry point. … This is worse than just picking up a bunch of papers and reading them. At least papers have abstracts, introductions, previous work." A second, independent structural complaint: diagrams were "at the end of each node rather than presented in the relevant part of the text." Both are architecture-of-content problems, not per-node writing quality — so the fix belongs in the binding standard, not in edits.

## Decision

Each tutorial node's prose must open with a no-symbols orientation (where we are, the gist, why it matters) before any formalism, and must place diagrams inline via figure data-dia anchors at the point of discussion.

Codified in `authoring/voice-and-audience.md` §5: an opening of ~120–220 words with the three named beats, then intuition + concrete example, then math with dimensions, then the subtlety, then a where-it-leads hand-off; and one `<figure data-dia="ID"></figure>` anchor per `diagrams[]` entry, placed where the figure is discussed (renderer resolves anchors; end-of-node is only a fallback). The word budget was raised (~24–30k) explicitly to pay for orientation — "readability comes first; the word budget is secondary."

## Alternatives considered

- **Fix the worst nodes individually, keep the brief** — treats a systemic failure as local; the miss was produced uniformly by 11 agents following the brief faithfully, so any future authoring would reproduce it. Rejected.
- **Add a separate "introduction" field to the node schema** — machine-checkable, but splits prose into fragments the renderer must reassemble, and an on-ramp's quality (connective tissue woven through, not bolted on) isn't schema-checkable anyway. Rejected; the standard lives in the editorial contract, enforced by exemplar + review.
- **Keep diagrams at node end with better captions** — rejected by direct reviewer instruction; the anchor mechanism cost ~20 renderer lines and preserves authoring flexibility per node.

## Consequences

Easier: every node is enterable from any path through the graph (the reviewer approved the rewritten exemplar before the fleet re-ran: "Yes this is much better"); diagrams sit beside the text they explain; future nodes inherit the standard from the brief. Harder: ~5k words of budget spent on orientation; revision agents needed explicit "rewrite prose only, preserve facts/edges/diagrams" constraints to apply the standard without disturbing validated structure — a pattern any future content-standard change must repeat (brief → exemplar → approval → fleet).

## References

- [`../2026-07-05-1.md`](../2026-07-05-1.md) — the source retrospective.
- [`./SKILL-SPEC-be1e7dd0a9-briefed-fanout-authoring.md`](./SKILL-SPEC-be1e7dd0a9-briefed-fanout-authoring.md) — the exemplar-first recovery workflow.
- PRs the decision was made in: #1.
