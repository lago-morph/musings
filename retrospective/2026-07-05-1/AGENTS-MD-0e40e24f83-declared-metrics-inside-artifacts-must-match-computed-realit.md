# agent instruction

**Declared metrics inside artifacts must match computed reality.** "When an artifact self-reports a metric that tooling recomputes (a declared word count, row count, checksum), never hand-estimate it and never adjust the declaration to dodge a warning the content deserves. Fix the content or set the declaration to the computed truth — and keep the recomputing check advisory-but-loud in CI."

*Grounded in: the exemplar node declaring wordCount 1380 while the linter computed 854.*

# justification

The flagship exemplar node shipped declaring 1380 words when the linter's recomputation found ~854 — the honest number revealed the node was materially under its depth target, and the fix was writing the missing content, not editing the integer. Across two fan-outs the same advisory check caught several more drifted declarations from subagents. A metrics field that can silently lie is worse than no field: downstream budgeting (20k words across 20 nodes) was only trustworthy because the linter kept declarations honest.
