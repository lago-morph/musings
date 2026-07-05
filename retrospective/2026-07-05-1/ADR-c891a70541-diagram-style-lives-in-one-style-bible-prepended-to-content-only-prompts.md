# ADR: Diagram style lives in one style bible prepended to content-only prompts

- **ID**: ADR-c891a70541
- **Status**: Draft (not yet adopted to docs/adr/)
- **Date**: 2026-07-05
- **Source retrospective**: ../2026-07-05-1.md
- **PRs covered**: #1

## Context

The tutorial carries 37 diagrams whose whiteboard look must read as if one hand drew them, but they are produced by at least three different parties across time: subagents hand-building SVGs during authoring, a future image-generation agent in a separate session, and any later contributor. The reviewer's requirement was explicit: "The style of the diagrams should be defined in one place, in detail, so the diagrams will be consistent." Repeating style language inside 37 prompts would drift immediately and make a restyle a 37-file edit.

## Decision

All visual style for diagrams is defined once in authoring/diagram-style.md; node JSON carries content-only prompts, and every consumer (SVG author, image-generation agent) applies the style file rather than restating style per diagram.

The style bible carries a verbatim "Style Preamble" (§2) the image agent prepends to each prompt, exact palette hexes and typography (§3), layout/drawing conventions (§4–5), SVG rendition rules (§6), and instructions for writing content-only prompts (§7). The node schema documents that `diagrams[].prompt` "describes WHAT to depict … NOT the visual style."

## Alternatives considered

- **Style text embedded in every diagram prompt** — self-contained prompts, but 37 copies drift, restyling means editing every node, and the tap-to-reveal prompt popup would drown content in boilerplate. Rejected.
- **Style as image-agent-only instructions (not shared with SVG authors)** — the hand-built SVGs and generated images would diverge visually; in-session the SVG class palette (§6) and the preamble palette (§2/§3) sharing one hex table is what kept 37 SVGs from 12+ different agent runs coherent. Rejected.
- **No written style, rely on a reference image** — image models imitate style unreliably and SVG authors can't extract exact hexes/stroke rules from a picture; also unreviewable before any art exists. Rejected.

## Consequences

Easier: restyling the whole tutorial is a one-file edit; prompts stay short, reviewable, and display cleanly in the UI popup; SVG and future raster art share one definition (Q=blue/K=red/V=green stayed consistent across every attention-family diagram). Harder: prompts are not self-contained — any consumer MUST know to prepend the style file, so the image-generation brief (authoring/image-generation-agent.md) makes that step explicit and non-optional; a consumer that skips it produces off-style art silently.

## References

- [`../2026-07-05-1.md`](../2026-07-05-1.md) — the source retrospective.
- [`./SKILL-SPEC-be1e7dd0a9-briefed-fanout-authoring.md`](./SKILL-SPEC-be1e7dd0a9-briefed-fanout-authoring.md) — style bible as one of the fan-out contract files.
- PRs the decision was made in: #1.
