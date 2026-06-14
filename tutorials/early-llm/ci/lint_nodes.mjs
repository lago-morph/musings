#!/usr/bin/env node
// Linter for the early-LLM tutorial node graph.
//
// Checks, over nodes/*.json:
//   1. Each file is valid JSON and validates against schema/node.schema.json.
//   2. id matches filename (minus the NN- ordering prefix).
//   3. ids are unique; diagram ids are unique within a node.
//   4. Every edge is incident to the node that declares it (from === id || to === id).
//   5. Every edge references existing nodes (no dangling endpoints, no self-loops).
//   6. Every edge appears IDENTICALLY in BOTH endpoint files (bidirectional consistency).
//   7. contrast edges are stored with the lexicographically smaller id as `from`.
//   8. Declared svg paths exist on disk.
// Warnings (non-fatal): wordCount divergence from the recomputed count; diagram-to-word
//   ratio far from the ~1-per-800-words target.
//
// Exit code 0 = clean (warnings allowed), 1 = at least one error.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");          // tutorials/early-llm
const NODES_DIR = join(ROOT, "nodes");
const SCHEMA_PATH = join(ROOT, "schema", "node.schema.json");

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

// Stable key for an edge so the same edge in two files compares equal.
const edgeKey = (e) => `${e.type}|${e.from}|${e.to}`;

// Count words in prose: strip HTML tags and KaTeX math source, then count tokens.
function countWords(html) {
  const noTags = html.replace(/<[^>]*>/g, " ");
  const noDisplayMath = noTags.replace(/\\\[[\s\S]*?\\\]/g, " ");
  const noInlineMath = noDisplayMath.replace(/\\\([\s\S]*?\\\)/g, " ");
  const decoded = noInlineMath.replace(/&[a-zA-Z]+;|&#\d+;/g, " ");
  const tokens = decoded.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

function main() {
  if (!existsSync(NODES_DIR)) {
    console.error(`No nodes directory at ${NODES_DIR} — nothing to lint.`);
    process.exit(0);
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  const validate = ajv.compile(schema);

  const files = readdirSync(NODES_DIR).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) {
    console.error("nodes/ contains no .json files — nothing to lint.");
    process.exit(0);
  }

  const nodes = new Map();          // id -> { file, data, edgeKeys:Set }
  const idByFile = new Map();

  // Pass 1: parse + schema validate + intra-file checks.
  for (const file of files) {
    const path = join(NODES_DIR, file);
    let data;
    try {
      data = JSON.parse(readFileSync(path, "utf8"));
    } catch (e) {
      err(file, `invalid JSON: ${e.message}`);
      continue;
    }

    if (!validate(data)) {
      for (const e of validate.errors) {
        err(file, `schema: ${e.instancePath || "(root)"} ${e.message}`);
      }
      continue; // shape is unreliable; skip deeper checks for this file
    }

    // filename (minus NN- prefix) must equal id
    const expected = file.replace(/^\d+-/, "").replace(/\.json$/, "");
    if (expected !== data.id) {
      err(file, `filename implies id "${expected}" but id is "${data.id}"`);
    }
    if (nodes.has(data.id)) {
      err(file, `duplicate id "${data.id}" (also in ${nodes.get(data.id).file})`);
      continue;
    }

    // unique diagram ids
    const dseen = new Set();
    for (const d of data.diagrams) {
      if (dseen.has(d.id)) err(file, `duplicate diagram id "${d.id}"`);
      dseen.add(d.id);
      if (d.svg && !existsSync(join(ROOT, d.svg))) {
        err(file, `diagram "${d.id}" svg path not found: ${d.svg}`);
      }
    }

    // edges incident + orientation
    const edgeKeys = new Set();
    for (const e of data.edges) {
      if (e.from === e.to) err(file, `self-loop edge on "${e.from}"`);
      if (e.from !== data.id && e.to !== data.id) {
        err(file, `edge ${edgeKey(e)} is not incident to this node ("${data.id}")`);
      }
      if (e.type === "contrast" && e.from > e.to) {
        err(file, `contrast edge ${edgeKey(e)} must store smaller id as "from"`);
      }
      edgeKeys.add(edgeKey(e));
    }

    // wordCount advisory
    const actual = countWords(data.prose);
    if (data.wordCount > 0) {
      const diff = Math.abs(actual - data.wordCount);
      if (diff > Math.max(75, 0.15 * data.wordCount)) {
        warn(file, `declared wordCount ${data.wordCount} but computed ~${actual}`);
      }
    }
    // diagram ratio advisory (skip tiny intro/contrast nodes)
    if (actual >= 1000) {
      const ratio = actual / Math.max(1, data.diagrams.length);
      if (ratio > 1300 || ratio < 450) {
        warn(file, `diagram-to-word ratio off target: ${data.diagrams.length} diagram(s) for ~${actual} words (~1 per ${Math.round(ratio)})`);
      }
    }

    nodes.set(data.id, { file, data, edgeKeys });
    idByFile.set(file, data.id);
  }

  // Pass 2: cross-file edge consistency.
  for (const { file, data, edgeKeys } of nodes.values()) {
    for (const e of data.edges) {
      for (const endpoint of [e.from, e.to]) {
        if (endpoint === data.id) continue;
        const other = nodes.get(endpoint);
        if (!other) {
          err(file, `edge ${edgeKey(e)} references unknown node "${endpoint}"`);
          continue;
        }
        if (!other.edgeKeys.has(edgeKey(e))) {
          err(file, `edge ${edgeKey(e)} is missing from the other endpoint (${other.file})`);
        }
      }
    }
  }

  // Report.
  for (const w of warnings) console.log(`  warning  ${w}`);
  for (const e of errors) console.error(`  ERROR    ${e}`);
  console.log(
    `\nLinted ${nodes.size} node(s): ${errors.length} error(s), ${warnings.length} warning(s).`
  );
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
