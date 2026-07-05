# agent instruction

**Inspect shared publishing branches before pushing; add content at a subpath.** "Before pushing to a shared publishing branch such as gh-pages, fetch and list its current contents. If it already serves a site, add your artifact at a subpath in a fast-forward commit (via a temporary worktree) — never recreate the branch as an orphan or force-push over it."

*Grounded in: gh-pages already carrying the repo's live Hugo documentation site when publishing the tutorial prototype.*

# justification

The first publish attempt created an orphan gh-pages holding only the prototype; only the remote's non-fast-forward rejection prevented replacing the repository's live Hugo docs site with a single HTML file. Inspection took one git ls-tree; the fix was a subpath commit (early-llm/index.html) that left the Hugo root untouched and verifiably still serving 200. The failure mode this prevents — silently destroying a production site that belongs to a different workstream — is expensive and embarrassing; the guard costs two commands.
