# agent instruction

**Poll deployments for a content marker, not an HTTP 200.** "When waiting for a static-site deploy (GitHub Pages or similar) to go live, poll for a unique string that only the NEW version contains (a new element id, a new phrase) rather than for HTTP 200 — the old version, a cached copy, or a soft-404 page can all return 200."

*Grounded in: five GitHub Pages republish cycles of the tutorial prototype, each confirmed via grep for a version-unique marker.*

# justification

The prototype was republished to the same URL five times in one session. A 200-based check would have declared success instantly every time — the URL already served the previous version. Polling for version-unique markers ('id="rtMap"' after the map fix, 'Where we are' after the readability pass) gave a truthful go-live signal each cycle for the cost of choosing one grep string. Reporting "live" to a user who then loads the stale version burns trust and a full test round on their device.
