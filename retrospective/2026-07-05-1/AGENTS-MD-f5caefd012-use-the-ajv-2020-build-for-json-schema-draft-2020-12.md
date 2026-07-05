# agent instruction

**Use the ajv 2020 build for JSON Schema draft 2020-12.** "When validating schemas declaring "$schema": "https://json-schema.org/draft/2020-12/schema" with ajv v8, import Ajv from "ajv/dist/2020.js" — the default "ajv" export supports draft-07 only and throws 'no schema with key or ref "https://json-schema.org/draft/2020-12/schema"' at compile time."

*Grounded in: first run of ci/lint_nodes.mjs crashing on the node schema.*

# justification

The tutorial's node schema was authored against draft 2020-12 and the linter's first run crashed inside ajv with the misleading error above, which reads like a missing remote $ref rather than a wrong-build import. The fix is a one-line import change, but only if you already know it; diagnosing it cold costs a debugging round-trip through ajv's docs. One sentence in the agents file converts that round-trip into zero.
