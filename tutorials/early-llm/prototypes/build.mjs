#!/usr/bin/env node
// Build the self-contained UI prototype from the real node content.
//
// Reads nodes/*.json, inlines each diagram's hand-built SVG, and emits a single
// self-contained prototypes/ui-prototype.html. Re-run after editing nodes or SVGs:
//   node prototypes/build.mjs
//
// The prototype exists so the reviewer can FEEL the UI choices for (a) the intro
// landing and (b) iPad navigation, with real KaTeX math, inline whiteboard SVGs,
// and the tap-a-diagram → see-its-prompt popup. KaTeX is loaded from a CDN (a
// prototype convenience; the shipped artifact will embed KaTeX offline).

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const NODES_DIR = join(ROOT, "nodes");

// Five narrative phases (id -> phase), used by the map and the path view.
const PHASES = [
  { key: "foundations", label: "Prehistory & foundations",
    ids: ["how-to-read-this-graph", "distributional-semantics", "word-embeddings", "rnn-lstm-baseline", "alignment-and-attention"] },
  { key: "core", label: "Core architecture",
    ids: ["scaled-dot-product-attention", "multi-head-attention", "positional-encoding", "the-transformer-block", "the-full-transformer"] },
  { key: "fork", label: "The encoder / decoder fork",
    ids: ["autoregressive-lm", "masked-lm", "encoder-decoder-contrast"] },
  { key: "training", label: "Training mechanics",
    ids: ["tokenization-subword-units", "pretraining-objectives", "optimization-and-training-dynamics", "data-and-compute"] },
  { key: "scaling", label: "Scaling & the bridge",
    ids: ["scaling-laws", "in-context-learning", "supervised-fine-tuning"] },
];

const ENTRY_POINTS = ["distributional-semantics", "scaled-dot-product-attention"];

function loadNodes() {
  const files = readdirSync(NODES_DIR).filter((f) => f.endsWith(".json")).sort();
  const nodes = {};
  for (const f of files) {
    const d = JSON.parse(readFileSync(join(NODES_DIR, f), "utf8"));
    for (const dia of d.diagrams) {
      dia.svgInline = dia.svg ? readFileSync(join(ROOT, dia.svg), "utf8") : null;
    }
    nodes[d.id] = d;
  }
  return nodes;
}

function main() {
  const nodes = loadNodes();
  const phases = PHASES.map((p) => ({ ...p, ids: p.ids.filter((id) => nodes[id]) }));
  const data = { nodes, phases, entryPoints: ENTRY_POINTS };
  // Embed safely: escape </ so an embedded "</script>" can't end the inline script,
  // and use a function replacement so "$" sequences in the JSON aren't treated as
  // String.replace special patterns.
  const json = JSON.stringify(data).replace(/<\//g, "<\\/");
  const html = TEMPLATE.replace("/*__DATA__*/", () => json);
  writeFileSync(join(__dirname, "ui-prototype.html"), html);
  const n = Object.keys(nodes).length;
  const d = Object.values(nodes).reduce((a, x) => a + x.diagrams.length, 0);
  console.log(`Built prototypes/ui-prototype.html — ${n} nodes, ${d} diagrams inlined.`);
}

const TEMPLATE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Early-LLM Tutorial — UI Prototype</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
<style>
  :root{
    --ink:#222; --board:#fdfcf8; --paper:#fffefb; --line:#e7e5dd; --muted:#8a8a85;
    --blue:#2f6fed; --red:#e5484d; --green:#2e9e5b; --accent:#2f6fed;
    --maxread:46rem; --rail:19rem;
    --safe-b:env(safe-area-inset-bottom,0px);
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{
    font:17px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    color:var(--ink); background:var(--board); -webkit-text-size-adjust:100%;
  }
  h1,h2,h3,h4{line-height:1.25}
  a{color:var(--blue)}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em;background:#f1efe8;padding:.05em .35em;border-radius:4px}
  pre{background:#f1efe8;padding:.8em 1em;border-radius:8px;overflow:auto;font-size:.92em}
  table{border-collapse:collapse;width:100%;margin:1em 0;font-size:.95em}
  th,td{border:1px solid var(--line);padding:.45em .6em;text-align:left;vertical-align:top}
  th{background:#f4f2ea}
  blockquote{border-left:3px solid var(--line);margin:1em 0;padding:.2em 1em;color:#555}

  /* ---------- shell ---------- */
  .app{display:flex;min-height:100%}
  .rail{
    width:var(--rail);flex:0 0 var(--rail);border-right:1px solid var(--line);
    background:var(--paper);padding:1rem .9rem;overflow-y:auto;position:sticky;top:0;height:100vh;
  }
  .main{flex:1;min-width:0;display:flex;flex-direction:column}
  .reader{flex:1;overflow-y:auto;padding:2rem clamp(1rem,4vw,3rem) 6rem;display:flex;justify-content:center}
  .reader-inner{width:100%;max-width:var(--maxread)}

  .brand{font-weight:700;font-size:1.02rem;margin:.1rem 0 .2rem}
  .brand small{display:block;font-weight:400;color:var(--muted);font-size:.78rem;margin-top:.15rem}
  .phase{margin:1.1rem 0 .2rem;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
  .navlink{display:block;padding:.32rem .5rem;border-radius:7px;color:var(--ink);text-decoration:none;font-size:.93rem;cursor:pointer}
  .navlink:hover{background:#f1efe8}
  .navlink.active{background:#e9eefc;color:var(--blue);font-weight:600}
  .navlink.visited::before{content:"\2713 ";color:var(--green);font-weight:700}
  .navlink .nl-scope{display:none}
  .typebadge{font-size:.68rem;color:var(--muted);border:1px solid var(--line);border-radius:20px;padding:0 .4rem;margin-left:.35rem}

  .railtools{display:flex;gap:.4rem;margin:.7rem 0 .3rem}
  .railtools button{flex:1;padding:.45rem .3rem;border:1px solid var(--line);background:#fff;border-radius:8px;font-size:.82rem;cursor:pointer;color:var(--ink)}
  .railtools button:hover{border-color:var(--blue)}
  .railtools button.active{border-color:var(--blue);background:#e9eefc;color:var(--blue);font-weight:600}
  .mapvisual{border:1px solid var(--line);border-radius:12px;background:var(--paper);padding:.6rem;margin:1rem 0 1.4rem}
  .mapvisual svg{display:block;width:100%;height:auto}

  /* node body */
  .node-scope{color:var(--muted);font-style:italic;margin:.1rem 0 1.4rem;font-size:1.02rem}
  .node h1{font-size:1.7rem;margin:.2rem 0 .1rem}
  .node h3{font-size:1.18rem;margin:1.7rem 0 .5rem}
  .node h4{font-size:1.02rem;margin:1.2rem 0 .3rem}

  figure.dia{margin:1.6rem 0;border:1px solid var(--line);border-radius:12px;background:var(--paper);padding:.6rem .6rem .2rem;cursor:zoom-in;position:relative}
  figure.dia svg{display:block;width:100%;height:auto}
  figure.dia figcaption{font-size:.9rem;color:#555;padding:.55rem .4rem .6rem}
  .dia .tap{position:absolute;top:.6rem;right:.6rem;font-size:.7rem;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:20px;padding:.1rem .5rem;opacity:.9}
  .kind-conceptual{border-style:dashed}

  .bib{margin-top:2.2rem;border-top:1px solid var(--line);padding-top:1rem}
  .bib h3{margin-top:0}
  .bibitem{margin:.7rem 0;font-size:.95rem}
  .tier{font-size:.66rem;text-transform:uppercase;letter-spacing:.05em;border-radius:20px;padding:.05rem .5rem;margin-right:.45rem;vertical-align:.08em}
  .tier.primary{background:#e9eefc;color:var(--blue)}
  .tier.exposition{background:#eaf6ee;color:var(--green)}
  .bibitem .annot{color:#555;display:block;margin-top:.15rem}

  .nextbar{display:flex;gap:.6rem;flex-wrap:wrap;margin:2rem 0 0}
  .btn{appearance:none;border:1px solid var(--line);background:var(--paper);color:var(--ink);
       border-radius:10px;padding:.55rem .8rem;font-size:.92rem;cursor:pointer;text-align:left}
  .btn:hover{border-color:var(--blue)}
  .btn b{display:block;font-size:.72rem;color:var(--muted);font-weight:600}
  .btn .et-prerequisite{color:var(--ink)} .btn .et-leadsto{color:var(--red)} .btn .et-contrast{color:var(--muted)}

  /* landing / map / path views */
  .view{display:none}
  .view.show{display:block}
  .landing h1{font-size:1.9rem;margin-bottom:.2rem}
  .twoways{display:flex;gap:1rem;flex-wrap:wrap;margin:1.4rem 0}
  .waycard{flex:1 1 16rem;border:1px solid var(--line);border-radius:12px;background:var(--paper);padding:1rem;cursor:pointer}
  .waycard:hover{border-color:var(--blue)}
  .waycard h3{margin:.1rem 0 .3rem;font-size:1.1rem}
  .legend{display:flex;gap:1.2rem;flex-wrap:wrap;margin:1rem 0;font-size:.9rem;color:#555}
  .legend span{display:inline-flex;align-items:center;gap:.4rem}
  .lg{width:26px;height:0;border-top:2px solid var(--ink)}
  .lg.prereq{border-top-style:solid}
  .lg.leadsto{border-top:2px solid var(--red)}
  .lg.contrast{border-top:2px dashed var(--muted)}

  .mapgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(13rem,1fr));gap:.6rem}
  .mapcol h3{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:.6rem 0 .3rem}
  .mapnode{display:block;width:100%;text-align:left;border:1px solid var(--line);background:var(--paper);
           border-radius:10px;padding:.5rem .65rem;margin:.35rem 0;cursor:pointer}
  .mapnode:hover{border-color:var(--blue)}
  .mapnode.entry{border-color:var(--blue);box-shadow:inset 0 0 0 1px var(--blue)}
  .mapnode .mn-title{font-weight:600;font-size:.95rem}
  .mapnode .mn-scope{font-size:.8rem;color:#666;margin-top:.15rem;display:block}
  .mapnode.visited .mn-title::before{content:"\2713 ";color:var(--green)}

  /* top bar (mobile + swipe mode) */
  .topbar{display:none;align-items:center;gap:.6rem;padding:.55rem .8rem;border-bottom:1px solid var(--line);background:var(--paper);position:sticky;top:0;z-index:30}
  .topbar .tb-title{flex:1;min-width:0;font-weight:600;font-size:.98rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .iconbtn{appearance:none;border:1px solid var(--line);background:#fff;border-radius:9px;padding:.4rem .6rem;font-size:1rem;cursor:pointer;line-height:1}

  /* bottom tab bar (tabs mode, mobile) */
  .tabbar{display:none;position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--paper);
          border-top:1px solid var(--line);padding-bottom:var(--safe-b)}
  .tabbar .tabs{display:flex}
  .tabbar button{flex:1;appearance:none;border:0;background:none;padding:.55rem 0 .5rem;font-size:.72rem;color:var(--muted);cursor:pointer}
  .tabbar button .ic{display:block;font-size:1.15rem;line-height:1.2}
  .tabbar button.active{color:var(--blue)}

  /* sheet / drawer overlay */
  .scrim{display:none;position:fixed;inset:0;background:rgba(0,0,0,.32);z-index:50}
  .scrim.show{display:block}
  .sheet{position:fixed;z-index:60;background:var(--paper);overflow-y:auto;display:none}
  .sheet.show{display:block}
  .sheet .sheet-hd{display:flex;align-items:center;justify-content:space-between;padding:.8rem 1rem;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--paper)}
  .sheet .sheet-bd{padding:1rem}

  /* settings */
  .gear{position:fixed;right:.8rem;bottom:calc(.8rem + var(--safe-b));z-index:45;border-radius:50%;width:46px;height:46px;font-size:1.25rem;border:1px solid var(--line);background:var(--paper);cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.12)}
  .settings .seg{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 1rem}
  .settings .seg button{flex:1 1 8rem;padding:.5rem;border:1px solid var(--line);background:#fff;border-radius:9px;font-size:.85rem;cursor:pointer}
  .settings .seg button.on{border-color:var(--blue);background:#e9eefc;color:var(--blue);font-weight:600}
  .settings h4{margin:.6rem 0 .1rem}
  .settings .hint{font-size:.82rem;color:var(--muted);margin:.1rem 0 0}

  /* diagram prompt popup */
  .modal{display:none;position:fixed;inset:0;z-index:80;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,.45)}
  .modal.show{display:flex}
  .modal .box{background:#fff;border-radius:14px;max-width:40rem;width:100%;max-height:85vh;overflow:auto;padding:1.2rem 1.3rem;position:relative;box-shadow:0 10px 40px rgba(0,0,0,.25)}
  .modal .x{position:absolute;top:.6rem;right:.7rem;border:none;background:none;font-size:1.5rem;line-height:1;cursor:pointer;color:#666}
  .modal h4{margin:.2rem 0 .1rem;font-size:1.05rem}
  .modal .meta{font-size:.78rem;color:var(--muted);margin-bottom:.7rem}
  .modal .promptlabel{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-top:.4rem}
  .modal .prompttext{white-space:pre-wrap;background:#f7f6f1;border:1px solid var(--line);border-radius:9px;padding:.8rem;font-size:.92rem;margin-top:.3rem}
  .stub{color:var(--muted);font-style:italic;border:1px dashed var(--line);border-radius:10px;padding:1.2rem;text-align:center}

  /* ---------- responsive: phone / iPad portrait ---------- */
  @media (max-width: 900px){
    .rail{display:none}
    .topbar{display:flex}
    .reader{padding:1.2rem 1.1rem 7rem}
    /* nav-mode dependent chrome is toggled by body[data-nav] below */
    body[data-nav="tabs"] .tabbar{display:block}
    body[data-nav="tabs"] .topbar .tb-map{display:none}
    body[data-nav="swipe"] .tabbar{display:none}
    body[data-nav="rail"]  .tabbar{display:none}
  }
  @media (min-width: 901px){
    .topbar{display:none}
    .tabbar{display:none}
    /* on wide screens the persistent rail is the map; views render in main */
  }
</style>
</head>
<body data-intro="hybrid" data-nav="tabs">
<div class="app">
  <!-- persistent rail (wide screens) -->
  <aside class="rail" id="rail">
    <div class="brand">Early-LLM Tutorial <small>UI prototype · tap a diagram to see its prompt</small></div>
    <div class="railtools">
      <button id="rtIntro">Start</button>
      <button id="rtMap">Map</button>
      <button id="rtPath">Path</button>
    </div>
    <nav id="railnav"></nav>
  </aside>

  <div class="main">
    <div class="topbar">
      <button class="iconbtn tb-menu" id="tbMenu" aria-label="Menu">&#9776;</button>
      <div class="tb-title" id="tbTitle">Early-LLM</div>
      <button class="iconbtn tb-prev" id="tbPrev" aria-label="Previous">&#8249;</button>
      <button class="iconbtn tb-next" id="tbNext" aria-label="Next">&#8250;</button>
      <button class="iconbtn tb-map" id="tbMap" aria-label="Map">Map</button>
    </div>

    <div class="reader">
      <div class="reader-inner">
        <!-- LANDING -->
        <section class="view landing" id="view-landing"></section>
        <!-- MAP -->
        <section class="view map" id="view-map"></section>
        <!-- PATH -->
        <section class="view path" id="view-path"></section>
        <!-- NODE -->
        <section class="view node" id="view-node"></section>
      </div>
    </div>
  </div>
</div>

<!-- bottom tab bar (tabs mode) -->
<nav class="tabbar" id="tabbar">
  <div class="tabs">
    <button data-tab="node" class="active"><span class="ic">&#128214;</span>Read</button>
    <button data-tab="map"><span class="ic">&#129518;</span>Map</button>
    <button data-tab="path"><span class="ic">&#129517;</span>Path</button>
  </div>
</nav>

<!-- sheet + scrim (used for map drawer / rail sheet) -->
<div class="scrim" id="scrim"></div>
<aside class="sheet" id="sheet" style="inset:auto 0 0 0;max-height:80vh;border-top-left-radius:16px;border-top-right-radius:16px">
  <div class="sheet-hd"><strong id="sheetTitle">Map</strong><button class="iconbtn" id="sheetClose">&times;</button></div>
  <div class="sheet-bd" id="sheetBody"></div>
</aside>

<!-- settings -->
<button class="gear" id="gear" aria-label="UI options">&#9881;</button>
<div class="scrim" id="setScrim"></div>
<aside class="sheet settings" id="settings" style="inset:auto 0 0 0;max-height:85vh;border-top-left-radius:16px;border-top-right-radius:16px">
  <div class="sheet-hd"><strong>UI options to compare</strong><button class="iconbtn" id="setClose">&times;</button></div>
  <div class="sheet-bd">
    <p class="hint">These toggles change the live UI so you can feel each choice on the iPad. Defaults are my recommendations.</p>
    <h4>Intro landing</h4>
    <div class="seg" id="seg-intro">
      <button data-v="hybrid">Hybrid (recommended)</button>
      <button data-v="map">Map-first</button>
      <button data-v="path">Guided-path-first</button>
    </div>
    <p class="hint" id="intro-hint"></p>
    <h4>iPad navigation</h4>
    <div class="seg" id="seg-nav">
      <button data-v="tabs">Bottom tabs + drawer (recommended)</button>
      <button data-v="swipe">Swipe + map overlay</button>
      <button data-v="rail">Slide-in rail</button>
    </div>
    <p class="hint" id="nav-hint"></p>
  </div>
</aside>

<!-- diagram prompt popup -->
<div class="modal" id="modal">
  <div class="box">
    <button class="x" id="modalX" aria-label="Close">&times;</button>
    <h4 id="mTitle"></h4>
    <div class="meta" id="mMeta"></div>
    <div class="promptlabel">Generation prompt (content-only; whiteboard style applied separately)</div>
    <div class="prompttext" id="mPrompt"></div>
  </div>
</div>

<script>
const DATA = /*__DATA__*/;
const NODES = DATA.nodes, PHASES = DATA.phases, ENTRY = DATA.entryPoints;
const visited = new Set();
let current = null;

const INTRO_HINTS = {
  hybrid: "A short orientation that folds into the map: the reader gets their bearings and the two entry points, with the graph one tap away.",
  map: "Open straight onto the graph map — fastest for someone who wants to see the whole territory and choose.",
  path: "Open onto a suggested reading path — best for a reader who'd rather be led than choose."
};
const NAV_HINTS = {
  tabs: "Read / Map / Path tabs along the bottom; the map opens as a slide-up drawer. Thumb-friendly, nothing hidden.",
  swipe: "A slim top bar with ‹ › to move along the suggested path, plus a floating Map button that opens a full overlay.",
  rail: "A menu button slides in the full node rail from the left as a sheet — closest to the desktop layout."
};

function el(tag, cls, html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
function phaseOf(id){return PHASES.find(p=>p.ids.includes(id));}
function orderedIds(){return PHASES.flatMap(p=>p.ids);}
function typeLabel(t){return t==="intro"?"start here":t;}

function edgeLabel(e,fromId){
  const other = e.from===fromId? e.to : e.from;
  const t = NODES[other];
  const dir = e.from===fromId ? "→" : "←";
  return {other, title:t?t.title:other, type:e.type, dir};
}

/* ---------- rendering ---------- */
function renderRail(){
  const nav = document.getElementById('railnav'); nav.innerHTML='';
  for(const p of PHASES){
    nav.appendChild(el('div','phase',p.label));
    for(const id of p.ids){
      const n=NODES[id]; if(!n) continue;
      const a=el('a','navlink'+(id===current?' active':'')+(visited.has(id)?' visited':''));
      a.dataset.id=id; a.innerHTML=n.title+(n.type==='intro'?'<span class="typebadge">start</span>':n.type==='contrast'?'<span class="typebadge">contrast</span>':'');
      a.onclick=()=>openNode(id);
      nav.appendChild(a);
    }
  }
}

function diagramFigure(n,dia){
  const fig=el('figure','dia '+('kind-'+dia.kind));
  fig.innerHTML=dia.svgInline || '<div class="stub">[diagram SVG missing]</div>';
  fig.appendChild(el('span','tap','tap for prompt'));
  fig.appendChild(el('figcaption',null,(dia.kind==='conceptual'?'Conceptual · ':'Structural · ')+dia.caption));
  fig.onclick=()=>openModal(n,dia);
  return fig;
}

function renderNode(id){
  const n=NODES[id]; const root=el('div','node');
  root.appendChild(el('h1',null,n.title));
  root.appendChild(el('div','node-scope',n.oneLineScope));
  const body=el('div'); body.innerHTML=n.prose; root.appendChild(body);
  if(n.diagrams.length){
    root.appendChild(el('h3',null,'Diagrams'));
    for(const d of n.diagrams) root.appendChild(diagramFigure(n,d));
  }
  if(n.bibliography && n.bibliography.length){
    const b=el('div','bib'); b.appendChild(el('h3',null,'Bibliography'));
    for(const it of n.bibliography){
      const item=el('div','bibitem');
      const cite = it.url? '<a href="'+it.url+'" target="_blank" rel="noopener">'+it.citation+'</a>' : it.citation;
      item.innerHTML='<span class="tier '+it.tier+'">'+it.tier+'</span>'+cite+'<span class="annot">'+it.annotation+'</span>';
      b.appendChild(item);
    }
    root.appendChild(b);
  }
  // suggested next / connections
  const nav=el('div','nextbar');
  const out=n.edges.filter(e=>e.from===id && (e.type==='prerequisite'||e.type==='leads-to'));
  const lat=n.edges.filter(e=>e.type==='contrast');
  const mk=(e)=>{const l=edgeLabel(e,id);const b=el('button','btn');
    const et=l.type==='leads-to'?'et-leadsto':l.type==='contrast'?'et-contrast':'et-prerequisite';
    b.innerHTML='<b class="'+et+'">'+(l.type==='prerequisite'?'next · prerequisite':l.type)+'</b>'+l.title;
    b.onclick=()=>openNode(l.other);return b;};
  out.forEach(e=>nav.appendChild(mk(e)));
  lat.forEach(e=>nav.appendChild(mk(e)));
  root.appendChild(nav);
  return root;
}

function renderMap(into){
  into.innerHTML='';
  into.appendChild(el('h1',null,'The map'));
  into.appendChild(el('p','node-scope','Three edge types: prerequisite (understand first), leads-to (the forward arc), contrast (siblings worth comparing). Blue-outlined nodes are the two suggested entry points.'));
  const legend=el('div','legend');
  legend.innerHTML='<span><i class="lg prereq"></i>prerequisite</span><span><i class="lg leadsto"></i>leads-to</span><span><i class="lg contrast"></i>contrast</span>';
  into.appendChild(legend);
  const intro=NODES['how-to-read-this-graph'];
  if(intro && intro.diagrams[0] && intro.diagrams[0].svgInline){
    const mv=el('div','mapvisual'); mv.innerHTML=intro.diagrams[0].svgInline; into.appendChild(mv);
  }
  const grid=el('div','mapgrid');
  for(const p of PHASES){
    const col=el('div','mapcol'); col.appendChild(el('h3',null,p.label));
    for(const id of p.ids){
      const n=NODES[id]; if(!n) continue;
      const b=el('button','mapnode'+(ENTRY.includes(id)?' entry':'')+(visited.has(id)?' visited':''));
      b.innerHTML='<span class="mn-title">'+n.title+'</span><span class="mn-scope">'+n.oneLineScope+'</span>';
      b.onclick=()=>openNode(id);
      col.appendChild(b);
    }
    grid.appendChild(col);
  }
  into.appendChild(grid);
}

function renderPath(into){
  into.innerHTML='';
  into.appendChild(el('h1',null,'A suggested path'));
  into.appendChild(el('p','node-scope','One sensible trail through the graph, following prerequisites and the forward arc. You can wander off it any time via the map.'));
  const ids=orderedIds();
  for(const id of ids){
    const n=NODES[id]; if(!n) continue;
    const b=el('button','mapnode'+(visited.has(id)?' visited':''));
    b.innerHTML='<span class="mn-title">'+n.title+'</span><span class="mn-scope">'+n.oneLineScope+'</span>';
    b.onclick=()=>openNode(id);
    into.appendChild(b);
  }
}

function renderLanding(into){
  into.innerHTML='';
  const intro=NODES['how-to-read-this-graph'];
  into.appendChild(el('h1',null,intro?intro.title:'Welcome'));
  into.appendChild(el('div','node-scope',intro?intro.oneLineScope:''));
  const body=el('div'); body.innerHTML=intro?intro.prose:''; into.appendChild(body);
  // two ways in
  const tw=el('div','twoways');
  for(const id of ENTRY){
    const n=NODES[id]; if(!n) continue;
    const c=el('div','waycard');
    c.innerHTML='<h3>'+n.title+'</h3><p>'+n.oneLineScope+'</p>';
    c.onclick=()=>openNode(id);
    tw.appendChild(c);
  }
  into.appendChild(el('h3',null,'Two ways in'));
  into.appendChild(tw);
  const open=el('button','btn'); open.innerHTML='<b>or</b>Browse the whole map';
  open.onclick=()=>showView('map'); into.appendChild(open);
  if(intro && intro.diagrams[0]){
    into.appendChild(el('h3',null,'The territory'));
    into.appendChild(diagramFigure(intro,intro.diagrams[0]));
  }
}

/* ---------- view switching ---------- */
function typeset(node){ if(window.renderMathInElement){renderMathInElement(node,{delimiters:[{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],throwOnError:false});} }

function showView(name){
  for(const v of ['landing','map','path','node']) document.getElementById('view-'+v).classList.toggle('show',v===name);
  document.querySelectorAll('.tabbar button').forEach(b=>b.classList.toggle('active', b.dataset.tab===name || (name==='landing'&&b.dataset.tab==='node')));
  const rt={landing:'rtIntro',map:'rtMap',path:'rtPath'}[name];
  ['rtIntro','rtMap','rtPath'].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.toggle('active',id===rt);});
  if(name==='map') renderMap(document.getElementById('view-map'));
  if(name==='path') renderPath(document.getElementById('view-path'));
  if(name==='landing'){renderLanding(document.getElementById('view-landing'));typeset(document.getElementById('view-landing'));}
  window.scrollTo(0,0);
  const r=document.querySelector('.reader'); if(r) r.scrollTo(0,0);
}

function openNode(id){
  if(!NODES[id]) return;
  current=id; visited.add(id);
  const host=document.getElementById('view-node'); host.innerHTML='';
  host.appendChild(renderNode(id));
  typeset(host);
  document.getElementById('tbTitle').textContent=NODES[id].title;
  showView('node');
  renderRail();
  closeSheet();
}

/* prev/next along the ordered path (swipe mode) */
function step(d){
  const ids=orderedIds(); const i=ids.indexOf(current);
  const ni = i<0 ? 0 : Math.min(ids.length-1, Math.max(0, i+d));
  openNode(ids[ni]);
}

/* ---------- sheet / drawer ---------- */
function openSheet(kind){
  const sheet=document.getElementById('sheet'), body=document.getElementById('sheetBody'), title=document.getElementById('sheetTitle');
  if(kind==='map'){title.textContent='Map';renderMap(body);}
  else {title.textContent='Sections';renderRailInto(body);}
  sheet.classList.add('show'); document.getElementById('scrim').classList.add('show');
}
function renderRailInto(host){
  host.innerHTML='';
  for(const p of PHASES){
    host.appendChild(el('div','phase',p.label));
    for(const id of p.ids){const n=NODES[id];if(!n)continue;
      const a=el('a','navlink'+(visited.has(id)?' visited':''));a.innerHTML=n.title;a.onclick=()=>openNode(id);host.appendChild(a);}
  }
}
function closeSheet(){document.getElementById('sheet').classList.remove('show');document.getElementById('scrim').classList.remove('show');}

/* ---------- diagram popup ---------- */
function openModal(n,dia){
  document.getElementById('mTitle').textContent=n.title+' — '+dia.caption;
  document.getElementById('mMeta').textContent=(dia.kind==='structural'?'Structural diagram':'Conceptual diagram')+' · id '+dia.id+(dia.generatedImage?' · image generated':' · image not yet generated');
  document.getElementById('mPrompt').textContent=dia.prompt;
  document.getElementById('modal').classList.add('show');
}
function closeModal(){document.getElementById('modal').classList.remove('show');}

/* ---------- settings ---------- */
function applyIntro(v){
  document.body.dataset.intro=v;
  document.querySelectorAll('#seg-intro button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  document.getElementById('intro-hint').textContent=INTRO_HINTS[v];
}
function applyNav(v){
  document.body.dataset.nav=v;
  document.querySelectorAll('#seg-nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  document.getElementById('nav-hint').textContent=NAV_HINTS[v];
  // top bar affordances per mode
  document.getElementById('tbPrev').style.display = v==='swipe'?'':'none';
  document.getElementById('tbNext').style.display = v==='swipe'?'':'none';
  document.getElementById('tbMap').style.display  = v==='swipe'?'':'none';
  document.getElementById('tbMenu').style.display = v==='rail'?'':'none';
}
function landingForIntro(){
  const v=document.body.dataset.intro;
  if(v==='map') showView('map');
  else if(v==='path') showView('path');
  else showView('landing');
}

/* ---------- wire up ---------- */
function init(){
  renderRail();
  applyIntro('hybrid'); applyNav('tabs');
  landingForIntro();

  // tab bar
  document.querySelectorAll('.tabbar button').forEach(b=>b.onclick=()=>{
    const t=b.dataset.tab; if(t==='node'){ current?showView('node'):landingForIntro(); } else showView(t);
  });
  // rail tools (always visible on wide screens)
  document.getElementById('rtIntro').onclick=()=>landingForIntro();
  document.getElementById('rtMap').onclick=()=>showView('map');
  document.getElementById('rtPath').onclick=()=>showView('path');
  // top bar
  document.getElementById('tbMenu').onclick=()=>openSheet('rail');
  document.getElementById('tbMap').onclick=()=>openSheet('map');
  document.getElementById('tbPrev').onclick=()=>step(-1);
  document.getElementById('tbNext').onclick=()=>step(1);
  document.getElementById('tbTitle').onclick=()=>landingForIntro();
  // sheet
  document.getElementById('sheetClose').onclick=closeSheet;
  document.getElementById('scrim').onclick=closeSheet;
  // settings
  document.getElementById('gear').onclick=()=>{document.getElementById('settings').classList.add('show');document.getElementById('setScrim').classList.add('show');};
  const closeSet=()=>{document.getElementById('settings').classList.remove('show');document.getElementById('setScrim').classList.remove('show');};
  document.getElementById('setClose').onclick=closeSet;
  document.getElementById('setScrim').onclick=closeSet;
  document.querySelectorAll('#seg-intro button').forEach(b=>b.onclick=()=>{applyIntro(b.dataset.v);landingForIntro();});
  document.querySelectorAll('#seg-nav button').forEach(b=>b.onclick=()=>applyNav(b.dataset.v));
  // modal
  document.getElementById('modalX').onclick=closeModal;
  document.getElementById('modal').onclick=(e)=>{ if(e.target.id==='modal') closeModal(); };
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'){closeModal();closeSheet();} });
}
window.addEventListener('DOMContentLoaded',init);
</script>
</body>
</html>`;

main();
