# agent instruction

**Enforce cross-file invariants with verbatim-copy blocks plus a linter, not prose instructions.** "When N generated files must agree on shared structure (edges declared in two files, shared constants, mirrored definitions), put the canonical blocks in ONE source-of-truth file, instruct authors to copy them verbatim, and add a CI check that fails unless the copies are byte-identical. Do not rely on prose like "make sure the edges match"."

*Grounded in: 27 tutorial-graph edges duplicated across 20 node files by 22 independent subagents with zero mismatches.*

# justification

The early-LLM tutorial requires every graph edge to appear identically in both endpoint JSON files. Instead of asking subagents to coordinate, authoring/node-graph.md carried a ready-to-paste edges[] block per node, and ci/lint_nodes.mjs failed on any byte difference. Across two full fan-outs (22 independent agent runs, 27 edges, 20 files) the bidirectional-consistency check never once fired on a real mismatch — a class of coordination bug that prose instructions reliably produce was engineered out for the cost of one markdown file and ~30 lines of linter.
