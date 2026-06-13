# Early-LLM Tutorial

A self-guided, **graph-structured** introduction to how early transformers and the first large
language models work and were trained — roughly *Attention Is All You Need* (2017) through GPT-3 and
scaling laws (2020), ending with a brief bridge to supervised fine-tuning. Written for a technically
strong reader who is new to the post-2017 deep-learning literature. See `SPEC.md` for the full design
rationale, audience, and scope.

## How this directory is organized

```
tutorials/early-llm/
  SPEC.md                      Design spec (purpose, audience, scope, decisions)
  PLAN.md                      Living build plan + task tracker (status of each phase)
  README.md                    This file

  schema/
    node.schema.json           Formal JSON Schema every node file must satisfy

  authoring/                   The authoring contract — read before writing content or diagrams
    voice-and-audience.md      Who we write for and how the prose sounds (shared by all authors)
    diagram-style.md           The "whiteboard" style bible — single source of visual truth
    node-graph.md              Canonical node list + edge map (copy edge blocks verbatim)
    image-generation-agent.md  Brief for the separate agent that generates diagram images

  nodes/
    NN-<id>.json               One file per node. Edges are declared on BOTH endpoints.

  diagrams/
    svg/<node-id>/<id>.svg     Hand-built SVGs (authoritative for structural diagrams)
    generated/                 Raster images, produced later by the image-generation agent

  prototypes/
    ui-prototype.html          Self-contained UI prototype (intro + iPad-nav options) [Phase 4]

  ci/
    lint_nodes.mjs             Schema + edge-consistency linter (Node 22 + ajv)
    package.json               Linter dependencies
```

CI: `.github/workflows/early-llm-lint.yml` runs the linter on every push/PR that touches this
directory.

## Authoring a node (quick start)

1. Read `authoring/voice-and-audience.md`, `authoring/diagram-style.md`, and `authoring/node-graph.md`.
2. Create `nodes/NN-<id>.json` with `id` matching the filename (minus the `NN-` prefix).
3. **Copy the node's `edges[]` block verbatim** from `node-graph.md` §3 so both endpoints match.
4. Write `prose` as an HTML string (KaTeX math in `\( \)` / `\[ \]`); define every symbol and shape.
5. For each diagram, write a content-only `prompt` (style comes from the style bible), set `kind`,
   `caption`, `altText`, and an `svg` path; leave `generatedImage` as `null`.
6. Validate locally:

```bash
cd tutorials/early-llm/ci
npm install
node lint_nodes.mjs
```

The linter is green only when every node validates against the schema and every edge appears,
identically, in both of its endpoint files.
