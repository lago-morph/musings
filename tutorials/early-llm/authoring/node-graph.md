# Canonical Node & Edge Map

**This file is authoritative for the graph's structure.** Node ids, the node list, and the full
edge set are defined here. When authoring a node, **copy its edge objects verbatim from §3 below**
into the node's `edges[]` array. Because both endpoints copy the *same* object, the two files match
byte-for-byte and `ci/lint_nodes.mjs` passes. Do not invent, rename, or reshape edges in a node
file; if the graph needs to change, change it *here* first, then update both endpoint files.

Conventions:
- **Filename:** `nodes/NN-<id>.json`, where `NN` is the ordering prefix below and `<id>` is the slug.
- **id** equals the filename minus the `NN-` prefix and `.json`.
- **contrast** edges are undirected; we store them with the **lexicographically smaller id as
  `from`** so both endpoints agree on orientation.

---

## 1. Node list (~20 nodes, ~20,000 words total)

| NN | id | type | target words | oneLineScope |
|----|----|------|--------------|--------------|
| 01 | `how-to-read-this-graph` | intro | 600–800 | How this graph is organized, the edge-type legend, and where to start. |
| 02 | `distributional-semantics` | concept | 1000–1300 | Meaning from co-occurrence — the vector-space view of words, from Firth and Harris. |
| 03 | `word-embeddings` | concept | 1200–1500 | Dense learned word vectors: word2vec and GloVe, and the analogy arithmetic that surprised everyone. |
| 04 | `rnn-lstm-baseline` | concept | 1200–1500 | The recurrent sequence models transformers replaced, and the two problems that doomed them. |
| 05 | `alignment-and-attention` | concept | 1200–1500 | Soft, learned alignment in neural MT (Bahdanau, Luong) — the direct ancestor of attention. |
| 06 | `scaled-dot-product-attention` | concept | 1300–1500 | How a token gathers information from others via weighted soft lookup — the core operation. |
| 07 | `multi-head-attention` | concept | 1200–1500 | Why several attention heads in parallel beat one, and how they are split and recombined. |
| 08 | `positional-encoding` | concept | 1100–1400 | Why a permutation-equivariant model needs order injected, and how (sinusoidal vs. learned). |
| 09 | `the-transformer-block` | concept | 1300–1500 | Residual connections, layer norm, and the position-wise FFN — the repeating unit. |
| 10 | `the-full-transformer` | concept | 1300–1500 | The encoder–decoder stack as published in Vaswani et al. 2017, assembled end to end. |
| 11 | `autoregressive-lm` | concept | 1200–1500 | Decoder-only, left-to-right language modeling: the GPT lineage and its factorization. |
| 12 | `masked-lm` | concept | 1200–1500 | Encoder-only, bidirectional context: BERT and the masked-token objective. |
| 13 | `encoder-decoder-contrast` | contrast | 800–1000 | When and why to pick encoder-only, decoder-only, or encoder–decoder; T5's text-to-text framing. |
| 14 | `tokenization-subword-units` | concept | 1100–1400 | The vocabulary problem and its subword answer: BPE, WordPiece, SentencePiece. |
| 15 | `pretraining-objectives` | concept | 1200–1500 | Causal LM, masked LM, next-sentence, span corruption — what the model is actually trained to predict. |
| 16 | `optimization-and-training-dynamics` | concept | 1200–1500 | Adam, warmup-then-decay schedules, the original transformer recipe, and batching at scale. |
| 17 | `data-and-compute` | concept | 1000–1300 | The corpora (BooksCorpus, WebText, C4) and the compute story behind the first models. |
| 18 | `scaling-laws` | concept | 1200–1500 | Loss as a power law in parameters, data, and compute (Kaplan et al. 2020). |
| 19 | `in-context-learning` | concept | 1200–1500 | GPT-3 and few-shot prompting: learning a task from the prompt without weight updates. |
| 20 | `supervised-fine-tuning` | concept | 600–900 | Terminal bridge: instruction–response fine-tuning of a base model; InstructGPT/FLAN; RLHF as "next." |

**Entry points** (surfaced by the intro node): `distributional-semantics` for the conceptually
minded; `scaled-dot-product-attention` for the impatient who want the mechanism first.

## 2. Master edge list (27 edges)

**prerequisite** (understand `from` before `to`):
- `distributional-semantics → word-embeddings`
- `word-embeddings → scaled-dot-product-attention`
- `rnn-lstm-baseline → alignment-and-attention`
- `alignment-and-attention → scaled-dot-product-attention`
- `scaled-dot-product-attention → multi-head-attention`
- `scaled-dot-product-attention → positional-encoding`
- `multi-head-attention → the-transformer-block`
- `positional-encoding → the-transformer-block`
- `the-transformer-block → the-full-transformer`
- `the-full-transformer → autoregressive-lm`
- `the-full-transformer → masked-lm`
- `tokenization-subword-units → pretraining-objectives`
- `scaled-dot-product-attention → pretraining-objectives`
- `the-transformer-block → optimization-and-training-dynamics`
- `autoregressive-lm → scaling-laws`
- `scaling-laws → in-context-learning`
- `in-context-learning → supervised-fine-tuning`

**contrast** (siblings worth comparing; smaller id is `from`):
- `autoregressive-lm ↔ masked-lm`
- `autoregressive-lm ↔ encoder-decoder-contrast`
- `encoder-decoder-contrast ↔ masked-lm`
- `encoder-decoder-contrast ↔ the-full-transformer`

**leads-to** (narrative arc):
- `how-to-read-this-graph → distributional-semantics`
- `how-to-read-this-graph → scaled-dot-product-attention`
- `encoder-decoder-contrast → tokenization-subword-units`
- `pretraining-objectives → optimization-and-training-dynamics`
- `optimization-and-training-dynamics → data-and-compute`
- `data-and-compute → scaling-laws`

## 3. Per-node `edges[]` — copy verbatim

> Each block is the exact `edges` array for that node file. Copy it as-is.

**01 how-to-read-this-graph**
```json
[
  { "from": "how-to-read-this-graph", "to": "distributional-semantics", "type": "leads-to" },
  { "from": "how-to-read-this-graph", "to": "scaled-dot-product-attention", "type": "leads-to" }
]
```

**02 distributional-semantics**
```json
[
  { "from": "how-to-read-this-graph", "to": "distributional-semantics", "type": "leads-to" },
  { "from": "distributional-semantics", "to": "word-embeddings", "type": "prerequisite" }
]
```

**03 word-embeddings**
```json
[
  { "from": "distributional-semantics", "to": "word-embeddings", "type": "prerequisite" },
  { "from": "word-embeddings", "to": "scaled-dot-product-attention", "type": "prerequisite" }
]
```

**04 rnn-lstm-baseline**
```json
[
  { "from": "rnn-lstm-baseline", "to": "alignment-and-attention", "type": "prerequisite" }
]
```

**05 alignment-and-attention**
```json
[
  { "from": "rnn-lstm-baseline", "to": "alignment-and-attention", "type": "prerequisite" },
  { "from": "alignment-and-attention", "to": "scaled-dot-product-attention", "type": "prerequisite" }
]
```

**06 scaled-dot-product-attention**
```json
[
  { "from": "how-to-read-this-graph", "to": "scaled-dot-product-attention", "type": "leads-to" },
  { "from": "word-embeddings", "to": "scaled-dot-product-attention", "type": "prerequisite" },
  { "from": "alignment-and-attention", "to": "scaled-dot-product-attention", "type": "prerequisite" },
  { "from": "scaled-dot-product-attention", "to": "multi-head-attention", "type": "prerequisite" },
  { "from": "scaled-dot-product-attention", "to": "positional-encoding", "type": "prerequisite" },
  { "from": "scaled-dot-product-attention", "to": "pretraining-objectives", "type": "prerequisite" }
]
```

**07 multi-head-attention**
```json
[
  { "from": "scaled-dot-product-attention", "to": "multi-head-attention", "type": "prerequisite" },
  { "from": "multi-head-attention", "to": "the-transformer-block", "type": "prerequisite" }
]
```

**08 positional-encoding**
```json
[
  { "from": "scaled-dot-product-attention", "to": "positional-encoding", "type": "prerequisite" },
  { "from": "positional-encoding", "to": "the-transformer-block", "type": "prerequisite" }
]
```

**09 the-transformer-block**
```json
[
  { "from": "multi-head-attention", "to": "the-transformer-block", "type": "prerequisite" },
  { "from": "positional-encoding", "to": "the-transformer-block", "type": "prerequisite" },
  { "from": "the-transformer-block", "to": "the-full-transformer", "type": "prerequisite" },
  { "from": "the-transformer-block", "to": "optimization-and-training-dynamics", "type": "prerequisite" }
]
```

**10 the-full-transformer**
```json
[
  { "from": "the-transformer-block", "to": "the-full-transformer", "type": "prerequisite" },
  { "from": "the-full-transformer", "to": "autoregressive-lm", "type": "prerequisite" },
  { "from": "the-full-transformer", "to": "masked-lm", "type": "prerequisite" },
  { "from": "encoder-decoder-contrast", "to": "the-full-transformer", "type": "contrast" }
]
```

**11 autoregressive-lm**
```json
[
  { "from": "the-full-transformer", "to": "autoregressive-lm", "type": "prerequisite" },
  { "from": "autoregressive-lm", "to": "scaling-laws", "type": "prerequisite" },
  { "from": "autoregressive-lm", "to": "masked-lm", "type": "contrast" },
  { "from": "autoregressive-lm", "to": "encoder-decoder-contrast", "type": "contrast" }
]
```

**12 masked-lm**
```json
[
  { "from": "the-full-transformer", "to": "masked-lm", "type": "prerequisite" },
  { "from": "autoregressive-lm", "to": "masked-lm", "type": "contrast" },
  { "from": "encoder-decoder-contrast", "to": "masked-lm", "type": "contrast" }
]
```

**13 encoder-decoder-contrast**
```json
[
  { "from": "autoregressive-lm", "to": "encoder-decoder-contrast", "type": "contrast" },
  { "from": "encoder-decoder-contrast", "to": "masked-lm", "type": "contrast" },
  { "from": "encoder-decoder-contrast", "to": "the-full-transformer", "type": "contrast" },
  { "from": "encoder-decoder-contrast", "to": "tokenization-subword-units", "type": "leads-to" }
]
```

**14 tokenization-subword-units**
```json
[
  { "from": "encoder-decoder-contrast", "to": "tokenization-subword-units", "type": "leads-to" },
  { "from": "tokenization-subword-units", "to": "pretraining-objectives", "type": "prerequisite" }
]
```

**15 pretraining-objectives**
```json
[
  { "from": "tokenization-subword-units", "to": "pretraining-objectives", "type": "prerequisite" },
  { "from": "scaled-dot-product-attention", "to": "pretraining-objectives", "type": "prerequisite" },
  { "from": "pretraining-objectives", "to": "optimization-and-training-dynamics", "type": "leads-to" }
]
```

**16 optimization-and-training-dynamics**
```json
[
  { "from": "the-transformer-block", "to": "optimization-and-training-dynamics", "type": "prerequisite" },
  { "from": "pretraining-objectives", "to": "optimization-and-training-dynamics", "type": "leads-to" },
  { "from": "optimization-and-training-dynamics", "to": "data-and-compute", "type": "leads-to" }
]
```

**17 data-and-compute**
```json
[
  { "from": "optimization-and-training-dynamics", "to": "data-and-compute", "type": "leads-to" },
  { "from": "data-and-compute", "to": "scaling-laws", "type": "leads-to" }
]
```

**18 scaling-laws**
```json
[
  { "from": "autoregressive-lm", "to": "scaling-laws", "type": "prerequisite" },
  { "from": "data-and-compute", "to": "scaling-laws", "type": "leads-to" },
  { "from": "scaling-laws", "to": "in-context-learning", "type": "prerequisite" }
]
```

**19 in-context-learning**
```json
[
  { "from": "scaling-laws", "to": "in-context-learning", "type": "prerequisite" },
  { "from": "in-context-learning", "to": "supervised-fine-tuning", "type": "prerequisite" }
]
```

**20 supervised-fine-tuning**
```json
[
  { "from": "in-context-learning", "to": "supervised-fine-tuning", "type": "prerequisite" }
]
```
