# Diagram Style Bible — "Whiteboard"

**This is the single source of truth for how every diagram in this tutorial looks.** It exists so
that ~25 diagrams, built by different hands and a later image-generation pass, look like one person
drew them in one sitting. Two consumers read this file:

1. **The SVG author** (hand-building the inline SVGs) follows §§4–7.
2. **The image-generation agent** prepends §§2–3 (the *Style Preamble*) to every content prompt it
   pulls from a node's `diagrams[].prompt`. The per-diagram prompt describes only *what* to draw;
   *how* it looks lives here and nowhere else. To restyle the whole tutorial, edit this file.

The chosen style is **whiteboard**: the look of a sharp, well-organized explainer drawn in marker
on a clean whiteboard — confident hand-drawn strokes, a tight palette, generous whitespace,
everything labeled. It is friendly and human without being cute. It is *not* a polished vector
infographic, not corporate flat-design, not 3D, not photoreal.

---

## 1. The one-paragraph soul of the style

A clean white (or very faint warm-grey) board. Diagrams are drawn with a small set of dry-erase
markers: a dominant near-black for structure and text, with **blue, red/orange, and green** used
sparingly and *meaningfully* (never decoratively). Strokes look hand-drawn — slightly uneven,
rounded ends, the occasional line that overshoots a corner just a little — but the lettering is
neat and immediately legible. Lots of breathing room. Boxes, arrows, and labels; matrices drawn as
labeled rectangles with their shapes written beside them. Nothing glossy, no drop shadows, no
gradients, no textures beyond the faint board. If it looks like a confident teacher's whiteboard
two minutes into a great explanation, it's right.

## 2. Style Preamble — paste verbatim ahead of every generation prompt

> Draw this as a hand-drawn **whiteboard diagram**. White board background (very slightly warm, near
> #FDFCF8). Everything looks drawn with dry-erase markers: confident but slightly uneven strokes,
> rounded stroke ends, corners that occasionally overshoot a hair. Neat, highly legible hand-lettered
> labels (upright, not script). Tight palette only: near-black ink (#22)
> for structure and text; **blue (#2F6FED)**, **warm red (#E5484D)**, and **green (#2E9E5B)** as
> accents used only to carry meaning. Generous whitespace; clean, uncluttered layout; left-to-right
> or top-to-bottom flow. Flat 2-D only. **No** drop shadows, **no** gradients, **no** 3-D, **no**
> photorealism, **no** glossy or neon effects, **no** background texture beyond the faint board, **no**
> decorative clip-art. Label every important element. Arrows are thin with small open/triangular
> heads. Matrices and tensors are drawn as plain labeled rectangles with their dimensions written
> beside them. Keep it calm and pedagogical, like a great teacher's whiteboard mid-explanation.

(The image agent appends the per-diagram content prompt after this preamble. Keep this preamble and
the palette in §3 identical between the SVGs and the generated images.)

## 3. Palette & typography (exact values)

| Role | Color | Hex | Use for |
|---|---|---|---|
| Ink | near-black | `#222222` | all structure, boxes, default text, arrows |
| Board | warm white | `#FDFCF8` | background fill |
| Blue | marker blue | `#2F6FED` | the "subject" / current focus; primary data path; Q |
| Red | warm red | `#E5484D` | attention/important emphasis; the "scores"/weights; K |
| Green | marker green | `#2E9E5B` | outputs / "good" end-states; values; V |
| Muted | grey | `#8A8A85` | secondary annotations, de-emphasized/"masked" elements |

- **Color carries meaning, never decoration.** Within the *attention* family of diagrams, keep a
  consistent mapping so the reader learns it once: **Q = blue, K = red, V = green**, scores/weights
  in red, masked/ignored elements in muted grey. Outside that family, use blue for "the thing under
  discussion," green for "the result," red for "watch out / the key step." Document any deviation in
  the diagram's caption.
- **Type:** hand-lettered look. SVGs use the font stack
  `"Comic Sans MS", "Comic Neue", "Patrick Hand", "Segoe Print", system-ui, sans-serif` — chosen for
  a legible casual-marker feel that renders on the iPad/Safari without web fonts. Labels are upright,
  sentence-case, never ALL-CAPS except short tags like `[MASK]`, `softmax`, dimension labels.
- **Type sizes (SVG, in a 100-unit-tall reference):** title ~7 units, primary labels ~5, dimension
  annotations ~3.5. Keep at most one title per diagram.

## 4. Layout & composition rules

- **Flow:** left-to-right for data pipelines (input on the left, output on the right); top-to-bottom
  for stacks (e.g. layers, the transformer block). Be consistent within a node.
- **Whitespace first.** Leave ≥1 label-height of margin around the whole figure and between
  unrelated groups. Crowding is the most common way these diagrams go wrong.
- **One idea per diagram.** If you're tempted to add a second concept, that's a second diagram.
- **Reading aids:** group related elements with a light grey rounded enclosure when it clarifies
  scope (e.g. "one head"); label the group.
- **Aspect ratio:** prefer ~4:3 or ~3:2 landscape for pipelines; portrait is fine for tall stacks.
  Author SVGs with an explicit `viewBox` and **no fixed pixel width/height** so they scale in the UI.

## 5. Drawing conventions (shared vocabulary across diagrams)

- **Boxes / nodes:** rectangles with slightly rounded corners (`rx≈3` in the 100-unit reference),
  2-unit stroke, white fill. Operations (softmax, layer-norm, FFN) are boxes; data (matrices,
  vectors) are also boxes but **always carry a shape annotation**.
- **Matrices & tensors:** a plain rectangle labeled with its name *inside* (e.g. `Q`) and its shape
  *beside or below* in muted grey (e.g. `n × d_k`). For a stack of vectors, draw 3–4 stacked thin
  rectangles with an ellipsis to suggest `n` rows. Never imply a precise count you don't mean.
- **Arrows:** thin (1.5-unit) near-black lines, small triangular heads, rounded caps. A labeled
  arrow puts its label in a small gap mid-line, not crossing the line. Avoid crossings; route around.
- **Element-wise vs. matmul:** label the operation on the arrow or in the op-box ("× (matmul)",
  "⊕ add", "⊙ element-wise"). Do not leave the reader to infer which multiplication is meant.
- **Emphasis:** to highlight one row/column/path, redraw *that element* in the accent color and
  thicken slightly; do not use fills, glows, or shadows.
- **De-emphasis / masking:** muted grey, optionally with a light hatch or a small `−∞` tag for the
  causal-mask case.
- **Annotations:** short margin notes in muted grey with a thin leader line are encouraged ("row-wise
  softmax → each row sums to 1"). Keep them terse.

## 6. SVG rendition specifics (for the hand-built `diagrams/svg/...` files)

The SVG is the *simple, precise* version. For **structural** diagrams it is authoritative (likely
final); for **conceptual** diagrams it is a clean placeholder a generated image may later supplement.

- Root: `<svg viewBox="0 0 W H" role="img" aria-label="...">` with the node's `altText` in
  `aria-label`/`<title>`. **No** width/height attributes (let CSS scale it). Use the diagram's
  100-unit-tall reference scaled to a convenient `viewBox`.
- Self-contained: no external fonts, images, scripts, or CSS. Inline a small `<style>` block inside
  the SVG defining classes (`.ink`, `.blue`, `.red`, `.green`, `.muted`, `.lbl`, `.dim`) using the
  exact hexes and font stack above, so every SVG shares one definition.
- Approximate the hand-drawn feel cheaply: `stroke-linecap="round"`, `stroke-linejoin="round"`, a
  consistent stroke width, and a *slight* irregularity is welcome (e.g. a 0.5–1° rotation on a box,
  a path that overshoots a corner by ~1 unit) — but **legibility wins over wobble**. Don't sacrifice
  alignment of labels for the sake of looking hand-drawn.
- Keep it small and readable as source: comment each major group (`<!-- Q projection -->`).
- Accessibility: include `<title>` and, for multi-part figures, `<desc>`.

## 7. Writing a good diagram `prompt` (content-only — for node authors)

The `prompt` in a node's `diagrams[]` entry is the **content specification**: it must fully
determine *what* is drawn and *every label*, and must say **nothing about visual style** (style comes
from §§2–3). It serves three masters: the SVG author builds from it, the image agent generates from
it, and the UI shows it verbatim in the tap-to-reveal popup. So write it as clear prose a competent
illustrator could follow exactly. A good prompt states:

1. **The subject** in one line ("Data flow of scaled dot-product attention for one head").
2. **Every element and its exact label**, in reading order, including matrix names and shapes.
3. **The connections / flow** between elements (what feeds what; which operation sits between).
4. **What to emphasize** semantically (e.g. "highlight the row-wise softmax"), in meaning terms —
   not in colors (the style file maps meaning→color).
5. **Kind:** note whether it's `structural` (precise) or `conceptual` (analogy), matching the JSON.

Keep prompts self-contained (don't say "as in the previous diagram"). Aim for 60–150 words.

### Worked example (structural)

> Structural data-flow diagram, left to right, of scaled dot-product attention for a single head.
> On the left, an input matrix labeled `X` with shape `n × d_model` (drawn as a stack of rows). Three
> arrows labeled `× W_Q`, `× W_K`, `× W_V` lead from `X` to three matrices: `Q` (`n × d_k`),
> `K` (`n × d_k`), and `V` (`n × d_v`). `Q` and `K` feed a matmul box producing scores `QKᵀ`
> (`n × n`); emphasize this scores matrix as the heart of the operation. An arrow labeled `÷ √d_k`
> leads to a `softmax (row-wise)` box, annotated "each row sums to 1", producing the attention weight
> matrix `A` (`n × n`). `A` and `V` feed a final matmul producing the output (`n × d_v`) on the right.
> Label every matrix with its shape. Mark, with a small note, that a causal mask would set
> above-diagonal score entries to `−∞` before the softmax.

### Worked example (conceptual)

> Conceptual analogy illustration: "soft lookup". A single query token on the left, drawn as a little
> labeled card reading "what am I looking for?", points toward a row of several "key" cards each
> reading "what I offer". Each key card connects to a matching "value" card behind it. Faint
> proportional bands from the query to each key suggest a soft, weighted match (some thick, some
> thin) rather than picking exactly one — emphasize that the result is a blend of values weighted by
> match strength, not a single hard lookup. No equations; this is the intuition companion to the
> structural diagram.
