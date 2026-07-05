# Spec: `gh-pages-subpath-publish`

- **ID**: SKILL-SPEC-3ffd5c575c
- **Source retrospective**: ../2026-07-05-1.md

## Intent

Publish a self-contained HTML artifact to an existing GitHub Pages site non-destructively, at a subpath, when the user cannot view the artifact as a file attachment. Born from a session where an iPad user saw only a blank file preview (previews don't execute JavaScript); the fix was to inspect the existing gh-pages branch (it carried a live Hugo site), add the artifact as early-llm/index.html alongside it via a temporary git worktree, push fast-forward, and poll the public URL for a version-unique content marker until the deploy went live. The skill packages that sequence so the artifact gets a stable, Safari-openable URL without clobbering whatever the Pages site already serves.

## Trigger

- Direct: "put it on GitHub Pages", "give me a URL for this", "I can't view it on my iPad/phone", "publish the prototype".
- Proactive: the deliverable is an interactive HTML file and the user is on a mobile/tablet client, or a previously attached HTML file came back as "blank"/"broken".
- Negative: do NOT trigger for static images/PDFs (attachments render those fine), or when the repo is private and the user hasn't confirmed a public URL is acceptable — publishing makes content world-readable.

## Inputs

- Path to the built HTML artifact (e.g. `tutorials/early-llm/prototypes/ui-prototype.html`).
- A subpath name for the site (e.g. `early-llm`).
- The repo's remote with push access to `gh-pages` (or the branch the repo's Pages config points at).
- A version-unique marker string present in the NEW artifact (an element id or phrase added in this iteration).

## Outputs

- A fast-forward commit on `gh-pages` adding/updating `<subpath>/index.html`, all pre-existing site content untouched.
- The live URL (`https://<owner>.github.io/<repo>/<subpath>/`) reported to the user only after the marker is observed in the served page.

## Workflow

1. `git fetch origin gh-pages`. If the branch does not exist, create an orphan branch containing only `<subpath>/index.html` and `.nojekyll`, and note the user may need to enable Pages in repo settings.
2. If it exists, **inspect before touching**: `git ls-tree --name-only origin/gh-pages` and `git log -1 origin/gh-pages`. If it serves an existing site (an `index.html`, theme assets), you MUST add at a subpath; never orphan-replace or force-push.
3. Publish via an isolated worktree so the working branch is undisturbed:
   `git worktree add -B gh-pages /tmp/ghwt origin/gh-pages && mkdir -p /tmp/ghwt/<subpath> && cp <artifact> /tmp/ghwt/<subpath>/index.html && git -C /tmp/ghwt add <subpath>/index.html && git -C /tmp/ghwt commit -m "..." && git -C /tmp/ghwt push origin gh-pages`; then `git worktree remove /tmp/ghwt --force` and delete the local `gh-pages` ref.
4. Verify the rest of the site still serves: `curl -s -o /dev/null -w '%{http_code}' https://<owner>.github.io/<repo>/` must stay `200`.
5. Poll for the deploy using the **content marker, not HTTP 200** (the URL serves the stale version with 200 during the rebuild): loop `curl -s <url> | grep -q '<marker>'` every ~6s for up to ~5 min, in a background task.
6. Report the URL to the user only after the marker check passes; on re-publishes, repeat steps 3–6 with a new marker.

## Concrete examples

### Example 1: first publish alongside a live Hugo site

Session state: `origin/gh-pages` existed with 154 files (`index.html`, `book.min.*.css`, `docs/`, `katex/` — a deployed Hugo Books site, last commit "Deploy site from main@6b820f7"). A naive orphan push was rejected non-fast-forward, which was the only thing that saved the site. Correct run: worktree on `origin/gh-pages`, `cp ui-prototype.html early-llm/index.html`, commit "Add early-llm UI prototype at /early-llm/ (non-destructive; alongside Hugo site)", push → `20cc1b0..39ba6cb`. Verified Hugo root still 200; polled `https://lago-morph.github.io/musings/early-llm/` until the page title marker appeared (~1–2 min); only then sent the URL.

### Example 2: iterative republish with a version marker

After fixing a navigation bug, the new build added a sidebar button `id="rtMap"`. Republish commit `b48a2db`, then poll `curl -ks <url> | grep -q 'id="rtMap"'`. A 200-based check would have "passed" instantly against the stale version; the marker flipped only when the rebuilt site actually served, and the user was told "live" truthfully. Same pattern for the next iteration with marker `Where we are`.

## Anti-patterns

- **Orphan-recreating or force-pushing `gh-pages`** — in-session this would have destroyed the repo's live documentation site; only the remote's fast-forward rejection prevented it.
- **Declaring "live" on HTTP 200** — Pages serves the previous version with 200 throughout the rebuild; the user then loads stale content and reports your fix missing.
- **Publishing from the working branch checkout** (checkout gh-pages in place) — risks mixing content-branch state into the publish; the worktree keeps them isolated.
- **Skipping the "rest of site still serves" check** — a subpath add should be provably non-destructive, not assumed.

## Acceptance criteria

- [ ] Pre-existing `gh-pages` content is byte-identical after publish (only `<subpath>/` changed).
- [ ] Push is fast-forward; no force flags anywhere in the workflow.
- [ ] The reported URL served the new version's marker before the user was notified.
- [ ] The working branch's checkout and index are untouched afterwards (worktree removed, stray local `gh-pages` ref deleted).
- [ ] Re-running for an unchanged artifact is a no-op or an explicit "already current" message.

## Files this skill creates / modifies

- `gh-pages:<subpath>/index.html` — the published artifact (the only path written on the branch).
- `/tmp/ghwt*` (transient) — temporary worktree, always removed.
