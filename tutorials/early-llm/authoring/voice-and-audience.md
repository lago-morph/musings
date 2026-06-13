# Voice & Audience Brief

**This file is the shared authoring contract.** Every content subagent receives it verbatim
along with `node-graph.md` and `diagram-style.md`. It governs *who we are writing for* and *how
the prose sounds*, so that twenty nodes authored across many sessions read as one consistent
document. If you are authoring or revising a node, follow this brief over your own instincts.

---

## 1. The reader (one specific person, and others like him)

- A PhD with ~40 years at a research university; now retired and reading for himself.
- Former **linguistics** researcher with **strong statistics**; a long-standing interest in
  cognition and information processing.
- Was fluent in **1980s–1990s AI**: connectionism, backpropagation-era neural nets, the PDP
  program, symbolic AI, HMMs, EM, statistical alignment.
- Has had **no exposure** to the post-2017 deep-learning / transformer literature. He is not a
  beginner in mathematics or in machine learning *as it was*; he is a beginner only in *this era's
  vocabulary and architecture*.
- He reads to **integrate and build on** the material. Subtly wrong content is actively harmful:
  he will carry an error forward into his own synthesis. Trustworthiness is the first virtue.

**What this means concretely**

- Assume linear algebra, probability, information theory, and optimization are *native*. Do not
  re-teach gradient descent, the chain rule, softmax-as-a-distribution, cross-entropy, or matrix
  multiplication. Use them.
- Do **not** assume any 2017+ terminology. The first time a term of art appears — *token*,
  *embedding*, *attention head*, *logits*, *causal mask*, *teacher forcing*, *fine-tuning* —
  define it in one clause, in his vocabulary, then use it freely thereafter.
- **Reach for his fields as the bridge.** These analogies are load-bearing, not decoration:
  - Distributional semantics (Firth, Harris: "you shall know a word by the company it keeps")
    as the conceptual root of embeddings.
  - **Statistical alignment models** (IBM Models, HMM alignment in MT) as the genuine ancestor of
    attention — soft, learned, content-addressed alignment. He may know these cold; use them.
  - Connectionism / PDP as the framing for distributed representations and end-to-end training.
  - HMMs, EM, n-gram language models, mixture models as reference points for the probabilistic
    objects (sequence likelihood, next-token distributions, smoothing) when they help.

## 2. The voice

Aim for the register of **an excellent colleague explaining something at a whiteboard** — someone
who respects the reader's intelligence, is precise, and is genuinely interested in the ideas.

- **Not dry, not chatty.** No textbook stiffness ("In this section we shall examine..."), and no
  forced breeziness, jokey asides, exclamation points, or "Don't worry!" reassurance. He does not
  need encouragement; he needs clarity and candor.
- **Confident and direct.** Prefer the active voice and declarative sentences. State what is true,
  then qualify if needed — don't hedge preemptively.
- **Lead the reader in; never start mid-thought.** This is a tutorial, not a paper's body text. A
  node must *open by orienting the reader* — see §5. Diving straight into machinery is the cardinal
  sin here: the reader is smart but new to this material, and a wall of detail with no on-ramp reads
  as worse than the original papers (which at least have abstracts and introductions). Respect his
  intelligence by being *clear and grounded*, not by being terse.
- **No filler — but orientation is not filler.** Cut empty throat-clearing ("In this section we
  shall examine…") and sentences that merely restate the heading. Do *not* cut motivation, the
  plain-language gist, the concrete example, or the connective tissue to other nodes — those are the
  most valuable sentences in the node, not the most expendable.
- **Motivate, then build, then formalize — in that order, every time.** Open a topic with the
  *problem it solves* and a plain-language picture before any symbols. The reader wants to know
  *why* a thing exists and *what it does in words* before *how it is written in math*. The equation
  is the reward for understanding, not the starting gun.
- **Show the connective tissue.** Constantly situate the node: what earlier idea it builds on, what
  question the previous node left open that this one answers, and what it sets up next. The reader
  should never wonder "why am I reading this and how does it relate to the rest?"
- **Intellectual honesty over tidiness.** Where the field is messy, hand-wavy, or post-hoc
  (e.g. why √d_k exactly, why these hyperparameters, what "emergence" really means), say so. Mark
  the boundary between what is established and what is folklore. He will trust the prose *more* for
  admitting the seams.

## 3. Mathematical conventions (uniform across all nodes)

Consistency here is non-negotiable — the reader will notice a symbol that changes meaning.

- **Define every symbol and every dimension on first use.** Not "the queries Q" but
  "the query matrix \\(Q \\in \\mathbb{R}^{n \\times d_k}\\), one row per position." He explicitly
  wants to know that Q is \\(n \\times d_k\\), not merely "the queries."
- **Shared notation (use these exact symbols):**
  - \\(n\\) — sequence length (number of tokens/positions).
  - \\(d_{\\text{model}}\\) — model/residual-stream width.
  - \\(d_k, d_v\\) — key/query and value dimensions (per head).
  - \\(h\\) — number of attention heads.
  - \\(L\\) — number of layers/blocks.
  - \\(V\\) — vocabulary size.
  - \\(X \\in \\mathbb{R}^{n \\times d_{\\text{model}}}\\) — the input/hidden representation,
    **one row per position** (row-vector convention; \\(Q = XW_Q\\), not \\(W_Q X\\)).
  - Weight matrices \\(W_Q, W_K, W_V\\), etc., capital \\(W\\) with a subscript.
  - \\(\\theta\\) — parameters; \\(\\mathcal{L}\\) — loss.
- **Row-vector / right-multiply convention throughout.** Tokens are rows. This matches how the
  code and the papers' shapes read; do not silently switch to column vectors in one node.
- **Equations carry one or two sentences of intuition, never a derivation.** Full derivations,
  proofs, and complexity arguments are delegated to the cited sources (and optionally sketched in
  the `expansion` field). State the result, give the intuition, point to the section of the paper.
- KaTeX delimiters: inline `\( ... \)`, display `\[ ... \]`. Escape backslashes correctly in JSON.

## 4. Bibliography conventions

- **Two tiers, always tagged:** `primary` (the original paper, for authority/detail) and
  `exposition` (a secondary source chosen because it *teaches* this point best).
- **Favor clarity over canon.** The best source for a practitioner, not merely the most cited.
- **Every entry is annotated**: what it is, what it's good for, how deep it goes, and for primary
  papers *which section* serves which point ("see §3.2.1 of Vaswani et al. for the exact operation;
  the scaling justification is in the footnote").
- Default exposition palette (use where apt; don't force): Alammar's *Illustrated Transformer*,
  the *Annotated Transformer*, Karpathy's *Zero to Hero* / nanoGPT, and d2l.ai chapters.
- Aim for **2–4 entries per concept node**, at least one of each tier where both exist.

## 5. Per-node structure — the on-ramp is mandatory

Every concept node MUST open with an orientation before any detail. This is the fix for the single
biggest failure mode: nodes that start mid-stream and assume you already understand everything. The
opening is not optional throat-clearing — it is the part that makes the rest readable.

**The opening (≈120–220 words, before any equation), in this spirit:**
1. **Where we are.** One or two sentences connecting to what came before: the question the
   prerequisite node(s) left open, or the limitation this node removes. Name the prior node(s) in
   plain words ("We just saw how a single attention head mixes information across positions; that
   raises an obvious question…"). Assume the reader may have arrived from a different path, so make
   the dependency explicit rather than implicit.
2. **The gist, in plain language (the "abstract").** In two to four sentences and *no symbols*, say
   what this node is about and what it does — the one-paragraph version someone could repeat back.
   This is the abstract the reader is owed.
3. **Why it matters.** Why this idea earns a node: what it unlocks, what would go wrong without it,
   where it sits in the larger story.

Only then proceed to the substance, still **intuition-first**:
4. **The idea in words, with a concrete example and his analogies** — before symbols. Walk one small
   concrete instance the reader can hold in their head.
5. **The math, with dimensions** — every symbol and shape defined, each equation preceded by the
   intuition for what it computes and followed by a sentence on how to read it. The formalism should
   feel inevitable by the time it appears.
6. **The subtlety** — the one thing easy to get wrong, or the design choice worth questioning
   (e.g. *why* scale by √d_k; *why* multiple heads), with the honest established-vs-folklore line.
7. **Where it leads.** Close by pointing along the graph's edges — what this sets up next and what
   sibling it contrasts with — so the reader always has a next step. Don't duplicate the linked node;
   hand off to it.

Weave the connective tissue (1, 3, 7) through the body too, not only at the seams. A reader dropped
into the middle of this node should, within a paragraph, know what it is, why they're here, and how
it connects.

**Contrast nodes** still open with the same orientation (what these siblings are, why comparing them
matters), then compare directly — a small HTML comparison table is welcome. The **intro node**
orients the reader to the whole graph and the edge-type legend. The **SFT node** is a brief terminal
bridge — orientation, then concept and supervised process only, naming InstructGPT/FLAN as the step
into chatbots and mentioning RLHF only as "where it goes next."

### Diagram placement (inline anchors — required)

Diagrams must appear *at the point in the prose where they are discussed*, not dumped at the end.
Place an empty anchor in the `prose` HTML exactly where each diagram belongs:

```html
<figure data-dia="d1"></figure>
```

Use the diagram's `id` (`d1`, `d2`, …). The renderer replaces each anchor with the actual diagram
(SVG + caption + tap-for-prompt). Every diagram in `diagrams[]` should have exactly one matching
anchor in the prose, and vice versa. Put the anchor right after the paragraph that motivates or
first refers to that figure (typically: the structural data-flow diagram after the mechanism is
described; the conceptual/analogy diagram near the intuition that opens the node).

## 6. Length & diagram budget (per node)

- **Readability comes first; the word budget is secondary.** The on-ramp (§5) is worth the words.
- **Total budget now ≈ 24,000–30,000 words** across the ~20-node graph (raised from 20k to pay for
  the orientations). **Concept nodes:** ~1,400–1,800 words including the opening. **Intro / contrast
  / SFT bridge:** ~800–1,100.
- Length should buy *clarity* (orientation, intuition, examples, connective tissue), never padding
  or repetition. If a node sprawls past ~1,900 words, tighten the detail or flag it for a split —
  but never by cutting the opening.
- **Diagrams scale with prose: roughly one diagram per ~800 words** (so ~2 for a big concept node,
  ~1 for a small node), *when a diagram genuinely earns its place*. A node that is pure comparison
  prose may carry fewer; do not invent diagrams to hit the ratio. Record `wordCount` honestly and
  let the linter's ratio check be advisory.
- Default to **structural** diagrams (precise, hand-built SVG) whenever a diagram carries exact
  information — data flow, tensor shapes, stacks. Reserve **conceptual** diagrams for analogy/
  intuition. See `diagram-style.md` for how to specify each.

## 7. Output format (what a node-authoring subagent returns)

A single JSON file valid against `schema/node.schema.json`:
- `prose` is one HTML string. Allowed tags: `p, h3, h4, ul, ol, li, strong, em, code, pre, table,
  thead, tbody, tr, th, td, figure, figcaption, blockquote, span`. **No** `<script>`, no inline
  styles beyond `class` hooks, no external URLs in the body.
- Math uses KaTeX delimiters as above.
- Each diagram gets a `diagrams[]` entry with a content-only `prompt` (see `diagram-style.md`),
  `kind`, `caption`, `altText`, and an `svg` path (which the SVG pass fills/builds).
- For each diagram, place a matching `<figure data-dia="ID"></figure>` anchor in the prose at the
  point it is discussed (see §5, "Diagram placement"). One anchor per diagram, one diagram per anchor.
- `edges[]` contains exactly the edges incident to this node, copied verbatim from `node-graph.md`
  so they match the other endpoint byte-for-byte (the linter enforces this).
- Set `generatedImage` to `null`. Leave `expansion` out unless the node warrants one.
