# agent instruction

**Deliver interactive HTML to users as a served URL, not a file attachment.** "When the deliverable is an HTML file whose value depends on JavaScript, publish it to a real URL (GitHub Pages, raw.githack, any static host) and send the link. Do not rely on chat or mobile file previews — they render markup but do not execute scripts, so the user sees a skeleton and reports the artifact as broken."

*Grounded in: the iPad file preview showing only the prototype's static sidebar header over a blank page.*

# justification

The prototype was sent as a file attachment; the user's iPad preview rendered the only server-side markup in the file (a sidebar header) over a blank page, and the session's deliverable appeared dead on arrival. Nothing was wrong with the artifact — file previews simply don't run JS. Publishing to GitHub Pages produced a stable Safari-openable URL and became the delivery channel for every subsequent iteration. The rule costs one publish step; skipping it costs a full confused-user round-trip on every mobile review.
