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
- **Earn every sentence.** No filler, no throat-clearing, no restating the heading. If a sentence
  doesn't add information or motivation, cut it.
- **Motivate before mechanizing.** Open a topic with the *problem it solves* before the machinery.
  The reader wants to know *why* a thing exists before *how* it is built.
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

## 5. Per-node structure (target shape, not a rigid template)

Each concept node's prose should generally move through:
1. **The problem it solves** — why this exists, ideally framed against something he knows.
2. **The idea** — the core mechanism in words and his analogies, before symbols.
3. **The math, with dimensions** — the equation(s), every symbol and shape defined, one or two
   sentences of intuition each.
4. **The subtlety** — the one thing that is easy to get wrong, or the design choice worth
   questioning (e.g. *why* scale by √d_k; *why* multiple heads).
5. **Where it connects** — a sentence or two pointing along the graph's edges (forward and back),
   reinforcing the navigation without duplicating the linked node.

Contrast nodes compare siblings directly (a small comparison table in HTML is welcome). The intro
node orients the reader to the graph and the edge-type legend. The SFT node is a **brief terminal
bridge** — concept and supervised process only, naming InstructGPT/FLAN as the step into chatbots
and mentioning RLHF only as "where it goes next."

## 6. Length & diagram budget (per node)

- **Total budget ≈ 20,000 words** across the ~20-node graph.
- **Concept nodes:** ~1,200–1,500 words of prose. **Intro / contrast / SFT bridge:** ~600–900.
- If a node would exceed ~1,600 words, that is a signal to **tighten**, not a license to sprawl;
  flag it for a possible split rather than padding.
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
- `edges[]` contains exactly the edges incident to this node, copied verbatim from `node-graph.md`
  so they match the other endpoint byte-for-byte (the linter enforces this).
- Set `generatedImage` to `null`. Leave `expansion` out unless the node warrants one.
