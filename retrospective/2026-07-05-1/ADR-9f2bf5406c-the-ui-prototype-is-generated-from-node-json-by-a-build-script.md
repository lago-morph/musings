# ADR: The UI prototype is generated from node JSON by a build script

- **ID**: ADR-9f2bf5406c
- **Status**: Draft (not yet adopted to docs/adr/)
- **Date**: 2026-07-05
- **Source retrospective**: ../2026-07-05-1.md
- **PRs covered**: #1

## Context

The UI prototype had to demonstrate real reading experience — ~28k words, KaTeX math, 37 inline SVGs, the tap-for-prompt popup — and then survive rapid iteration: in one session the content was revised twice (readability pass) and the chrome three times (map reachability, inline diagram anchors). Hand-maintaining a 700 KB self-contained HTML file through that churn would desynchronize it from `nodes/*.json` within one iteration.

## Decision

prototypes/ui-prototype.html is never edited by hand; prototypes/build.mjs regenerates it by inlining all node JSON and SVGs, so content edits happen in nodes/ and presentation edits happen in the builder template.

The builder embeds the data safely (escaping `</` so embedded `</script>` cannot terminate the inline script; function-form `String.replace` so `$` sequences in content aren't treated as replacement patterns) and resolves each diagram's inline `<figure data-dia>` anchor to the real SVG + caption + popup wiring, with an end-of-node fallback for unanchored diagrams.

## Alternatives considered

- **Hand-authored prototype with a few sample nodes pasted in** — cheaper initially, but the reviewer's decisive feedback ("unreadable", "diagrams at the end") came from reading REAL full nodes; sample-quality content would have hidden exactly the problems that mattered. Rejected.
- **Runtime fetch of node JSON (no build step)** — keeps one source of truth without regeneration, but breaks the single-file requirement: the artifact must open from a plain URL or local file on an iPad with no server guaranteed. Rejected for the prototype; noted as viable for a future served version.
- **Committing only the builder and building on demand** — the checked-in HTML is itself the deliverable users open and the thing published to Pages; requiring every consumer to run Node first adds friction for zero benefit at this repo's scale. Rejected; both builder and output are committed.

## Consequences

Easier: every content/UI iteration is `node prototypes/build.mjs` away from a publishable artifact (five same-day republish cycles in-session); content revisions by 11 subagents flowed into the prototype with zero manual assembly; the escaping rules live in one place. Harder: the committed HTML is generated — an edit made directly to it will be silently overwritten on the next build, so the file's provenance must stay documented in the README/builder header; large binary-ish diffs on each rebuild are accepted noise.

## References

- [`../2026-07-05-1.md`](../2026-07-05-1.md) — the source retrospective.
- [`./SKILL-SPEC-3ffd5c575c-gh-pages-subpath-publish.md`](./SKILL-SPEC-3ffd5c575c-gh-pages-subpath-publish.md) — how the built artifact is delivered.
- PRs the decision was made in: #1.
