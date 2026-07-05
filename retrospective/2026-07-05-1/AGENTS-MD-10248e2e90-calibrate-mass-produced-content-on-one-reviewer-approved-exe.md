# agent instruction

**Calibrate mass-produced content on one reviewer-approved exemplar before fanning out.** "Before dispatching subagents to author or revise many content files against a shared brief, produce ONE complete exemplar, get the human reviewer's explicit approval of its voice, depth, and structure, and only then fan out. When later review feedback changes the standard, fix the brief and the exemplar first, get re-approval, then re-run the fleet — never patch the fleet's output file by file."

*Grounded in: the 20-node early-LLM tutorial fan-out that had to be fully rewritten after reviewer feedback.*

# justification

In the early-LLM tutorial session, 11 subagents authored ~23,000 words against a brief that over-indexed on "expert reader, no filler." The reviewer's verdict on the result was "unreadable ... worse than just picking up a bunch of papers." Recovery required rewriting the authoring brief, rewriting one exemplar node, obtaining explicit reviewer approval ("Yes this is much better"), and re-dispatching 11 more subagents — roughly doubling the content-production cost of the session. The one exemplar that WAS shown to the reviewer early (scaled-dot-product-attention) is precisely where the miss was caught; had approval been gathered on it before the first fan-out, the entire second pass would have been the first. Marginal cost of the rule: one exemplar and one review round before pressing go.
