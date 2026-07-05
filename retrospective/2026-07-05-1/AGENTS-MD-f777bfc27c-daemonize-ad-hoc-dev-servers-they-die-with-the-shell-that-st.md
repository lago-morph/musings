# agent instruction

**Daemonize ad-hoc dev servers; they die with the shell that started them.** "A background server started inside one Bash tool call (even with &) dies when that call's shell exits. Start ad-hoc servers with setsid, redirect their output, and verify with a curl to the actual endpoint at the top of any later step that depends on them — treat ERR_CONNECTION_REFUSED from a test as "my server is gone," not as an application bug."

*Grounded in: the prototype's python http.server dying between Playwright runs mid-session.*

# justification

Midway through prototype testing, a Playwright run failed with net::ERR_CONNECTION_REFUSED because the http.server launched in an earlier tool call had died with its parent shell. The failure looks exactly like a broken artifact and invites debugging the wrong layer. setsid plus a pre-flight curl made every subsequent run deterministic. Cost: one shell idiom; benefit: no false-negative test runs against a server that quietly stopped existing.
