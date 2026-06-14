# Brief: Image-Generation Agent

You are a separate agent, in a separate session, whose only job is to turn the diagram **prompts**
already written into this repository into **generated raster images**, in a single consistent style,
and store them where the tutorial expects. You do not write prose, edit nodes' content, or change
the graph. Treat the repository as the source of truth.

## 0. Preconditions

- You have an image-generation tool available (an MCP image model or equivalent). If you do not,
  stop and report that; do not fabricate images.
- You have a clone of `lago-morph/musings` and may push to a branch (do **not** commit binary images
  to the main content branch without confirmation — see §5).

## 1. Read these first, in order

1. `tutorials/early-llm/authoring/diagram-style.md` — the **style bible**. §2 ("Style Preamble") and
   §3 (palette/typography) are the exact text and values you must apply to *every* image. This is
   how 25 diagrams come out looking like one hand drew them.
2. `tutorials/early-llm/schema/node.schema.json` — the `diagrams[]` shape you will read and the
   `generatedImage` field you will write.
3. This file.

## 2. What to generate, and the prompt you send

Walk every file in `tutorials/early-llm/nodes/*.json`. For each entry in a node's `diagrams[]`:

- **Build the full prompt** by concatenating, in this order:
  1. the verbatim **Style Preamble** from `diagram-style.md` §2,
  2. a single newline, then the diagram entry's **`prompt`** field verbatim (it is content-only by
     design — it says *what* to draw; the preamble says *how* it looks),
  3. if the diagram's `kind` is `structural`, append the sentence:
     *"Render all text labels exactly as written, spelled correctly, with arrows pointing exactly as
     described; do not invent or omit labels."*
- Send that combined prompt to the image model. Request a generous resolution (target the longer
  edge ≥ 1536 px) on a transparent or warm-white (#FDFCF8) background.

**Important caveat (do not skip):** image models are unreliable for text-dense, precise diagrams —
labels, arrow directions, and notation are exactly where they fail. The `structural` diagrams already
have authoritative hand-built SVGs (`diagrams/svg/...`). For `structural` diagrams, generate an image
only as an *optional companion*; if the model garbles labels, **leave `generatedImage` as `null`** and
move on — the SVG stands. Spend your reliability budget on the `conceptual` diagrams, where vibe
matters more than exact text.

## 3. Where to store images

Save each image to:

```
tutorials/early-llm/diagrams/generated/<node-id>/<diagram-id>.<ext>
```

e.g. `diagrams/generated/scaled-dot-product-attention/d2.png`. Use `.png` unless you have reason to
prefer `.webp`; be consistent. Create directories as needed.

## 4. Record the result back into the node

For each diagram you successfully generate, set that diagram's `generatedImage` field to the
**repo-relative path** you saved (e.g. `"diagrams/generated/scaled-dot-product-attention/d2.png"`).
Leave it `null` for any diagram you chose not to generate or whose output you rejected. Change
**nothing else** in the node files — not the prose, not the prompts, not the edges, not the `svg`
paths. After editing, the files must still validate: run `cd tutorials/early-llm/ci && npm install &&
node lint_nodes.mjs` and confirm it is green before you push.

## 5. Idempotency, review, and delivery

- **Idempotent:** skip any diagram whose `generatedImage` is already a non-null path that exists on
  disk, unless explicitly asked to regenerate. Re-running you should not duplicate work or overwrite
  accepted images.
- **Self-check each image** before recording it: are the requested elements present, is the style on
  model (whiteboard, the three accent colors used meaningfully, no gradients/3-D/photoreal), and —
  for any structural image you kept — are the labels correct? Reject and retry up to twice; then
  leave `null` and note it.
- **Delivery:** push to a clearly named branch (e.g. `claude/early-llm-generated-images`) and open a
  PR for review. Because images are binary and sizable, the reviewer decides whether they live in git
  or are referenced another way; do not assume. Summarize which diagrams you generated, which you
  skipped and why, and any prompts that fought back.

## 6. Style-consistency checklist (apply to the whole batch)

- One palette only (`#222`, accents `#2F6FED` / `#E5484D` / `#2E9E5B`, `#8A8A85` muted), warm-white
  board, hand-lettered upright labels.
- Color carries meaning, not decoration; within the attention family, Q=blue, K=red, V=green.
- Flat 2-D, generous whitespace, no shadows/gradients/3-D/neon/texture/clip-art.
- If you find yourself wanting to deviate from the style bible, **stop and ask** — consistency across
  the set matters more than any single image. The style lives in `diagram-style.md`; if it needs to
  change, it changes there, once, for everyone.
