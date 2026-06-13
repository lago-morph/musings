# Early-LLM Tutorial — Project Specification

**Status:** Draft v0.1 (design-complete, pre-build)
**Artifact:** `tutorials/early-llm/` in `lago-morph/musings`
**Last updated:** 2026-06-12

---

## 1. Purpose

A single, self-contained HTML file that serves as a **self-guided, graph-structured learning environment** for the early transformer / large-language-model era — roughly the period from *Attention Is All You Need* (2017) through GPT-3 and the scaling-laws work (2020), with a deliberately brief terminal treatment of supervised fine-tuning as the bridge to the first instruction-following chatbots.

The document is not a survey of frontier models. It is a careful, sourced introduction to **how transformers work and how the first small models were trained**, written for a reader who wants to understand fundamentals deeply enough to synthesize new material on top of them.

## 2. Audience

A single, specific reader (and others like him):

- PhD, ~40 years at a research university; now retired/independent.
- Former linguistics researcher; **strong statistics**; long-standing interest in cognition and information processing.
- Was current on 1980s–1990s AI (connectionism, backprop-era neural nets, the PDP program, symbolic AI).
- **No exposure** to the post-2017 deep-learning / transformer literature.
- Highly technical. Wants the math present to *make connections*, then wants to go to primary sources for the full detail.

**Design implications.**
- Lean on analogies from *his* fields: distributional semantics (Firth/Harris), statistical alignment models (IBM Models, HMM alignment) as the ancestor of attention, and connectionist framing for training.
- Define every symbol and **every tensor dimension** (he will want to know that Q is n×d_k, not merely "the queries").
- Equations carry one or two sentences of intuition; **no derivations or proofs in-line** — those are delegated to the cited papers via the bibliography.
- Analogies and diagrams are welcome even for this audience; they are load-bearing, not decoration.

## 3. Scope

### In scope
- Distributional-semantics and embedding prehistory (as the conceptual on-ramp).
- The attention mechanism, conceptually and mathematically (to the `softmax(QKᵀ/√d_k)V` level).
- The full transformer architecture and its components.
- The encoder/decoder fork: BERT (masked LM) vs. GPT (autoregressive LM) lineages.
- Training mechanics for the first small models: tokenization/subword units, pretraining objectives, optimization and schedules, data and compute.
- Scaling laws and in-context (few-shot) learning.
- **Brief** introduction to supervised fine-tuning / instruction following — concept and process only, framed as "where the story goes next."

### Out of scope (explicit non-goals)
- Frontier models and their capabilities.
- RLHF in depth, preference modeling, constitutional methods, etc. (SFT node may *mention* RLHF as the next step, no more.)
- Inference-time engineering (quantization, serving, KV-cache optimization).
- Multimodality, retrieval augmentation, agents.

### Boundary decisions already made
- The **SFT node is a terminal bridge node**, brief by design. It explains the concept and the supervised process (instruction–response pairs, fine-tuning a pretrained base) and names InstructGPT/FLAN as the canonical step into chatbots, then stops.
- "Training" primarily means **pretraining** (clean and well-documented for this era); SFT is the one fine-tuning topic included, and only briefly.

## 4. Content philosophy

- **Trustworthiness is the core virtue.** Every claim in prose should be either (a) something a careful author can stand behind, or (b) anchored to a cited primary source. The bibliography exists to keep the reader tethered to ground truth, because this reader will *integrate* what he reads and build on it — subtly wrong material is actively harmful here.
- **Bibliography favors clarity over canon.** Prefer the source that explains a concept best for a *practitioner* audience, not merely the most-cited. Primary papers where they are genuinely readable (Vaswani et al. largely is); high-quality exposition where it teaches better.
- **Two source tiers, marked distinctly:**
  - *Primary* — the original research papers (for detail and authority).
  - *Exposition* — secondary sources chosen for teaching quality (e.g., The Illustrated Transformer, The Annotated Transformer, Karpathy's "Zero to Hero" / nanoGPT, d2l.ai chapters).
- Each bibliography entry is **annotated**: what it is, what it is good for, how deep it goes, and (for primary papers) which section to read for a given point — e.g. "see §3.2 of Vaswani et al. for the full treatment."

## 5. Content architecture — the node graph

The material is a directed graph, not a linear sequence. The graph structure is both the content model and the navigation UI (see §7).

### 5.1 Node types
- **Concept node** — the standard unit: prose + math + analogy + diagram(s) + annotated bibliography.
- **Contrast node** — a node whose job is to compare siblings (e.g., encoder vs. decoder vs. encoder-decoder).
- **Intro/meta node** — "how to read this graph," entry-point guidance.

### 5.2 Edge types (typed, subtly rendered)
- **prerequisite** — "understand X before Y." Drives the suggested path and any unlock/gating hints.
- **contrast** — "X and Y are siblings worth comparing." Invites lateral hops.
- **leads-to** — "X sets up Y." The forward narrative arc (e.g., scaling → in-context learning → SFT).

### 5.3 Proposed node list (≈20 nodes)

> This list is for review. Node count, granularity, and boundaries are open for the reviewer to edit. Target granularity: 15–25 nodes; big nodes ~600–1000 words of prose, small nodes ~300.

**Prehistory / foundations**
1. **How to read this graph** *(intro/meta)* — orientation, edge-type legend, suggested entry points.
2. **Distributional semantics & the vector-space view** — Firth, Harris; "meaning from co-occurrence." The conceptual on-ramp for a linguist.
3. **Word embeddings** — word2vec (skip-gram/CBOW), GloVe; dense vectors, analogy arithmetic.
4. **Sequence models: the RNN/LSTM baseline** — what transformers replaced; the long-dependency and parallelism problems.
5. **Alignment & the original attention mechanism** — Bahdanau, Luong; attention as soft alignment, the direct ancestor (ties to statistical-MT alignment he may know).

**Core architecture**
6. **Scaled dot-product attention** *(sample node — see §9)* — the mathematical heart.
7. **Multi-head attention** — multiple representation subspaces; why heads.
8. **Positional encoding** — why order must be injected; sinusoidal vs. learned.
9. **The transformer block** — residual connections, layer normalization, position-wise FFN.
10. **The full transformer** — the encoder-decoder stack as published (Vaswani et al. 2017).

**The fork**
11. **Autoregressive language modeling (decoder-only)** — GPT-1; left-to-right factorization.
12. **Masked language modeling (encoder-only)** — BERT; bidirectional context, the [MASK] objective.
13. **Encoder vs. decoder vs. encoder-decoder** *(contrast)* — when/why each; T5 as the unifying "text-to-text" framing.

**Training mechanics (parallel track)**
14. **Tokenization & subword units** — BPE (Sennrich), WordPiece, SentencePiece; the vocabulary problem.
15. **Pretraining objectives** — causal LM, MLM, next-sentence prediction, span corruption.
16. **Optimization & training dynamics** — Adam, learning-rate warmup + decay, the original transformer schedule, batching.
17. **Data & compute** — BooksCorpus, WebText, C4; scale of the first models; the compute story.

**Scaling & the bridge**
18. **Scaling laws** — Kaplan et al. 2020; loss as a power law in params/data/compute.
19. **In-context / few-shot learning** — GPT-3 (Brown et al. 2020); the emergent prompting paradigm.
20. **Supervised fine-tuning & instruction following** *(terminal bridge, brief)* — instruction–response pairs, fine-tuning a base model; InstructGPT/FLAN named as the step into chatbots; RLHF mentioned only as "next."

### 5.4 Proposed edges (illustrative, for review)
- prerequisite: 2→3, 3→6, 4→5, 5→6, 6→7, 6→8, 7→9, 8→9, 9→10, 10→11, 10→12, 14→15, 6→15, 9→16, 11→18, 18→19, 19→20
- contrast: 11↔12 (both feed 13), 8(sinusoidal↔learned internal)
- leads-to: 10→{11,12}, 13→14 (architecture motivates training choices), 17→18, 19→20

**Entry points:** node 2 (for the conceptually minded), or jump straight to node 6 (for the impatient who want the mechanism first). The intro node surfaces both.

## 6. Node data model

Each node is a structured record (authoring format TBD — see §11 open items — likely a JS object literal embedded in the file):

```
Node {
  id:            string            // stable slug, e.g. "scaled-dot-product-attention"
  title:         string
  type:          "concept" | "contrast" | "intro"
  oneLineScope:  string            // for the map / hover
  prose:         html               // the main body (KaTeX math inline)
  diagrams:      Diagram[]          // see §8
  bibliography:  BibEntry[]         // annotated; tier-tagged
  expansion?:    string            // OPTIONAL — see §10; outline for agent-expansion seam
}

Edge {
  from: nodeId
  to:   nodeId
  type: "prerequisite" | "contrast" | "leads-to"
}

BibEntry {
  tier:      "primary" | "exposition"
  citation:  string
  url?:      string
  annotation: string               // what it's good for, how deep, which section for what
}
```

## 7. Navigation & UI

The graph **is** the interface. Understated, not gimmicky — obvious that navigation is over a graph, with clear "you are here" and "where you've been."

- **Wide screens (laptop, primary target):** persistent graph map as a side panel — an SVG node-link diagram with typed edges visually distinguishable (e.g., solid = prerequisite, dashed = contrast, arrowed accent = leads-to). Current node highlighted; visited nodes marked; suggested-next hinted.
- **Narrow screens (iPad, secondary):** map collapses to an overlay/drawer; touch-friendly node targets; hover-only affordances (edge highlight, tooltips) get tap equivalents or are dropped. iPad gets a **more limited** navigation surface by design.
- **Reading flow:** each node renders prose + math + diagrams + bibliography in the main pane. A "suggested next" control follows prerequisite/leads-to edges to give a default trail without forcing linearity; the map allows free wandering and lateral contrast hops.
- **Visited state:** **session-only for MVP** (in-memory; resets on close). localStorage persistence deferred to a later version.

## 8. Diagrams

Diagrams are first-class. Two production paths, each diagram tagged in its spec as one or the other:

- **SVG (hand-built, inline):** for anything where **precision matters** — attention data flow, the transformer block, matrix/tensor dimension diagrams, the encoder/decoder stack. Crisp, zoomable, zero file-size cost, no hallucinated labels.
- **Generated (image model via MCP):** for **conceptual / analogy illustrations** where vibe matters more than exact labels. Generated images are embedded as **base64** directly in the HTML (file budget is tens of MB, delivered via download link; this is fine).

> ⚠ Image models are unreliable for technical diagrams — text labels, arrow directions, and mathematical notation are exactly where they fail. Default to SVG whenever a diagram carries precise information.

**Every diagram begins life as a written specification** (what to depict, all labels, layout, style notes). For SVG diagrams the spec guides hand-construction; for generated diagrams the spec is the generation prompt. Specs are authored and reviewable **before** any image exists; until images are generated, the spec renders as a visible placeholder block so the MVP is fully reviewable without art.

**Note:** the image-model MCP connection is being set up in a separate session. Build proceeds with spec/placeholder blocks; image generation is a later pass.

## 9. Sample node outline — *Scaled Dot-Product Attention* (depth calibration)

> Provided so the reviewer can calibrate level of detail. This is the representative concept node; it exercises every element (prose, math with dimensions, field-specific analogy, both diagram types, two-tier bibliography). If this feels too compressed or too verbose, the lever is node *count*, not node *length*.

**id:** `scaled-dot-product-attention`
**type:** concept
**oneLineScope:** How a token gathers information from other tokens via weighted lookup — the core operation of the transformer.

**Prose arc (~700–900 words):**
1. *The problem it solves.* Each position needs a content-dependent mixture of information from other positions. Frame as **soft, differentiable lookup** — a generalization of a dictionary/database query, and a continuous cousin of the alignment weights in statistical MT (the Bahdanau/Luong link back to node 5).
2. *Queries, keys, values.* Define the analogy precisely: a query asks "what am I looking for," keys advertise "what I offer," values carry the payload. Each token emits all three via learned linear projections.
3. *The equation, with dimensions.*
   - Inputs: X ∈ ℝ^{n×d_model}; projections W_Q, W_K ∈ ℝ^{d_model×d_k}, W_V ∈ ℝ^{d_model×d_v}.
   - Q = XW_Q (n×d_k), K = XW_K (n×d_k), V = XW_V (n×d_v).
   - `Attention(Q,K,V) = softmax( QKᵀ / √d_k ) V`
   - QKᵀ is n×n (every query against every key); softmax is row-wise → a stochastic weight matrix; output is n×d_v.
4. *Why divide by √d_k.* Dot products grow with dimension; without scaling, softmax saturates into near–one-hot and gradients vanish. One sentence of intuition; full argument → bibliography.
5. *Masking.* One paragraph: causal masking (set future positions to −∞ before softmax) for autoregressive use — forward-links to node 11.

**Diagrams:**
- D1 *(SVG, precision):* data-flow from X through the three projections to Q/K/V, the QKᵀ matrix, scaling, softmax (row-wise), and the V-weighted sum to the output. All tensors labeled with shapes.
- D2 *(generated, analogy):* the "soft lookup / query against a set of keyed values" metaphor as an intuition-builder.

**Bibliography (annotated, two-tier):**
- *Primary* — Vaswani et al., "Attention Is All You Need" (2017), §3.2.1. *"The defining source. §3.2.1 is the half-page that specifies the operation exactly; read the scaling justification in the footnote."*
- *Exposition* — Alammar, "The Illustrated Transformer." *"Best visual walk-through of Q/K/V; start here if the matrix shapes don't click."*
- *Exposition* — Karpathy, "Let's build GPT" / nanoGPT. *"Implements attention from scratch in ~lines of PyTorch; for the reader who understands by building."*

**expansion (optional, see §10):** outline of the full derivation — softmax-saturation argument, gradient analysis, complexity (O(n²·d)), comparison to additive attention — explicitly the material the prose *omits* and sends to papers.

## 10. Optional designed-in seam: agent expansion

A **deferred, optional** feature (not in MVP scope, but the data model accommodates it now):

- Each node may carry an optional `expansion` field: an outline of the deeper treatment the prose deliberately omits (derivations, complexity, edge cases) — **complementary to** the prose, not a duplicate.
- A per-node "copy expansion prompt" button assembles a clean payload (the node's expansion outline + its bibliography + an instruction to expand *using those sources and cite them*) for the reader to paste into his own agent.
- **Honesty constraint:** this is a copy-paste affordance, not a live integration; an HTML file cannot call the reader's agent. The UI must not over-promise.
- **Provenance constraint:** because agent-expanded text is unverified and models are weakest on exactly this material, expansion outlines must be **citation-dense**, pushing any expansion toward the sources rather than the model's priors.
- Decision: include the `expansion` field in the data model now; build the button for one or two nodes as a proof of concept after the core works; then decide whether it earns its place.
- A richer v2 (out of scope here) would ship the node graph as a structured repo (JSON/Markdown per node) the reader's agent consumes directly — a better fit for agent expansion than a single file, but a different delivery mechanism.

## 11. Technical / delivery specification

- **Single self-contained HTML file.** No external runtime dependencies; opens in any browser; works offline.
- **Math:** KaTeX **embedded inline** (fonts included, ~1.2 MB) — no CDN, fully offline.
- **Size budget:** tens of MB acceptable. Delivered as a **download link**; stored on the reader's laptop.
- **Targets:** laptop primary (full graph navigation); iPad secondary (reduced navigation, touch-adapted).
- **Persistence:** session-only (in-memory) for MVP.
- **Images:** generated diagrams embedded as base64; SVG diagrams inline.
- **No build step required to read;** authoring may use a build step internally (TBD).

## 12. Review gates & sequence

1. **This spec** — reviewer edits scope, audience framing, boundaries.
2. **Node list + edges (§5.3–5.4)** — reviewer vetoes/edits nodes, granularity, entry points.
3. **Sample node depth (§9, Scaled Dot-Product Attention)** — reviewer calibrates level of detail. Lever for "too much/little" is node count, not node length.
4. **Diagram approach (§8)** — reviewer confirms SVG-vs-generated split.
5. Only then: full prose + bibliography authoring, then SVG diagrams, then (separate session) generated diagrams, then assembly + navigation UI.

## 13. Open items / decisions pending

- Authoring/source format for nodes (inline JS object literals vs. a small build from Markdown/JSON). Affects whether the v2 "structured repo for agents" path is cheap later.
- Exact total word budget (~8,000–10,000 words across ~20 nodes for the "~2 hours engaged reading" target).
- Whether the intro node also embeds a one-paragraph "map legend" or relies on the persistent panel.
- iPad navigation: exactly which affordances are dropped vs. tap-adapted.
- Final exposition-source list per node (confirm Illustrated Transformer, Annotated Transformer, Karpathy Zero-to-Hero, d2l.ai as the default palette).
