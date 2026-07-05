# Spec: `viewport-matrix-smoke-test`

- **ID**: SKILL-SPEC-af0081d636
- **Source retrospective**: ../2026-07-05-1.md

## Intent

Drive a web artifact with Playwright across every CSS breakpoint and input mode it claims to support, verifying not just that pages load but that every advertised view and control is reachable at each width. Born from a session where a graph Map view was completely unreachable on the primary target device (iPad, wider than 900px): the bottom tab bar holding the Map control was hidden by a media query and the wide-screen sidebar offered no substitute — invisible at the single width the author eyeballed, caught only when the user tested the real device. Also encodes the sandbox lessons: sandboxed egress may use a TLS-intercepting proxy (ERR_CERT_AUTHORITY_INVALID on CDN loads, fixed via ignoreHTTPSErrors) and ad-hoc HTTP servers die with their shell (use setsid).

## Trigger

- Direct: "test the prototype yourself", "verify it works on iPad/mobile", "run it in a browser".
- Proactive: before handing any responsive HTML artifact to a user, and after any CSS/media-query or navigation change.
- Negative: pure content edits with no layout/nav impact (a single-viewport render check suffices); non-interactive documents.

## Inputs

- The artifact (file path or URL). If a file, it must be served over HTTP for realistic CDN/script behavior.
- The artifact's **feature inventory**: every view/panel and the control(s) that reach it (e.g. Map view ← tab-bar button OR sidebar button).
- Its breakpoint list from the CSS (e.g. `@media (max-width: 900px)` ⇒ test both sides: 1366, 1024, 820, 390).
- Input modes: mouse; touch (`hasTouch: true, isMobile: true`).

## Outputs

- A PASS/FAIL line per (feature × viewport × input-mode) check, exit code 1 on any FAIL.
- Screenshots per viewport at the key states, for human review.
- Console/page-error capture (zero tolerance by default).

## Workflow

1. Serve the artifact: `setsid python3 -m http.server <port> > /tmp/http.log 2>&1 < /dev/null &`, then pre-flight `curl -s -o /dev/null -w '%{http_code}' <url>` — treat later `ERR_CONNECTION_REFUSED` as "server died", not as an app bug.
2. Locate a browser: try the installed Playwright's bundled Chromium first (`chromium.launch({args:['--no-sandbox']})`); only fall back to pulling a Docker Playwright image if launch fails. Note: global installs are CommonJS — `import pw from 'playwright'; const {chromium}=pw;`.
3. For each viewport in the matrix, create a context (`ignoreHTTPSErrors: true` in sandboxes — TLS-intercepting proxies break CDN certs; record that this is an environment artifact, not an app bug) and register `pageerror`/console-error listeners.
4. **Reachability first, correctness second**: for every advertised view, verify a *visible, clickable* control reaches it at this width — click/tap the real control, don't call the app's JS API (`page.evaluate(()=>openNode(...))` masks exactly the class of bug this skill exists to catch).
5. Then exercise the interactions: modals open from a tap and dismiss via every documented path (close button, backdrop, Esc); math/renderers produced output (`.katex` count > 0); embedded assets present.
6. Screenshot each viewport at its key states; report the PASS/FAIL table; on any FAIL, include the failing (feature, width, mode) triple so the fix is targeted.

## Concrete examples

### Example 1: the miss this skill prevents

The tutorial prototype's Map/Path views were reachable only via a bottom tab bar hidden by `@media (max-width: 900px)`'s inverse — at 1024 and 1366 (iPad portrait/landscape) no Map control existed at all. The session's otherwise-thorough 21-check suite passed because it navigated via `page.evaluate(() => window.openNode(...))` — the app-API shortcut of anti-pattern #1 — and the user found the dead end in minutes on the real device. The fix (sidebar Start/Map/Path buttons) was then verified the right way: `await p.locator('#rtMap').click()` at both 1366 and 1024, asserting `#view-map.show` and the inlined map SVG count.

### Example 2: separating environment artifacts from real failures

First full run: 19/21 PASS, with `ERR_CERT_AUTHORITY_INVALID` on three CDN loads and zero `.katex` nodes. Diagnosis: the sandbox's TLS-intercepting proxy, not the artifact — confirmed by re-running with `ignoreHTTPSErrors: true`, after which 21/21 passed with 51 rendered `.katex` nodes. The report to the user stated explicitly that the cert failure was an environment artifact and that a normal browser loads the CDN fine — and fed the "embed KaTeX offline for the shipped artifact" decision.

## Anti-patterns

- **Navigating via the app's JS API instead of visible controls** — passed 21 checks while the Map was unreachable on the target device.
- **Testing one width** — the bug lived on exactly the widths not eyeballed, including the primary device in both orientations.
- **Reading `ERR_CERT_AUTHORITY_INVALID` as an app bug** (or silently ignoring it) — classify it, re-run with `ignoreHTTPSErrors`, and disclose the environment caveat in the report.
- **Restarting the server inside each test command without a pre-flight** — a dead `http.server` produced `ERR_CONNECTION_REFUSED` mid-session and looked like a broken artifact.

## Acceptance criteria

- [ ] Every advertised view is reached through a visible control at every breakpoint in the matrix, in both mouse and touch contexts where claimed.
- [ ] Zero unexplained page/console errors; environment artifacts (proxy certs) are explicitly classified as such in the report.
- [ ] All modal/overlay dismissal paths are exercised (button, backdrop, Esc).
- [ ] Screenshots exist per viewport and were visually reviewed before reporting success.
- [ ] The script exits non-zero on any FAIL (usable as a CI gate).

## Files this skill creates / modifies

- `/tmp/.../pw-test.mjs` (or `tests/smoke/…` if the project wants it committed) — the matrix test script.
- `/tmp/.../pw/*.png` — per-viewport screenshots.
- `/tmp/http.log` — server log for the pre-flight/debugging.
