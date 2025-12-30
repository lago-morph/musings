# CRITICAL WORKFLOW RULES

## 🚨 MANDATORY USER CONFIRMATIONS (MOST CRITICAL)

### Never Start Tasks Without Permission
**WAIT for explicit "start task X" instruction. NEVER auto-continue to next task.**

### Never Mark Complete Without Confirmation
**Process:** Complete work → Present results → **WAIT** for "yes/approved" → Mark complete
**NEVER:** Mark complete immediately, assume approval, skip requirement verification

### Never Commit Without Confirmation
**Process:** Complete changes → Present changes → **WAIT** for "commit this" → Commit
**NEVER:** Auto-commit, assume user wants commit

### Task Verification Protocol
**MUST read complete task description and verify ALL requirements before asking approval.**
1. Read: method, validation criteria, purpose, language/output requirements
2. Self-check: ✅ method, validation, purpose, deliverables, testing complete
3. Present: what accomplished, how requirements satisfied, evidence criteria met

## ⚠️ CROSSPLANE V2 SAFETY (CRITICAL)
**Your training data is for v1. Assume all Crossplane knowledge is WRONG.**

**FORBIDDEN v1:** ❌ Claims, claimNames, Resources mode, old patch syntax
**REQUIRED v2:** ✅ Direct XRs, Pipeline mode, composition functions, modern XRD syntax

### Web Search Content Validation (CRITICAL)
**Crossplane v2.0 was released August 2025. Treat ALL content published before August 2025 with extreme skepticism.**

**RED FLAGS - Likely Outdated:**
- Published before August 2025
- References Claims or claimNames
- Shows Resources mode compositions
- Uses old patch syntax
- Examples from 2024 or earlier
- Blog posts from early 2025

**VALIDATION REQUIRED:**
- Always check publication dates on web search results
- Cross-reference with official Crossplane v2+ documentation
- When in doubt, search specifically for "Crossplane v2 [topic]"
- Prefer official docs over blog posts for syntax
- Be especially skeptical of Upbound provider examples from before August 2025

### Before Writing Any Crossplane Content:
1. **Start here**: `.kiro/reference/crossplane/danger-checklist.md` (30 seconds)
2. **Think in v2**: `.kiro/reference/crossplane/mental-models.md` (2 minutes)
3. **Web search**: "Crossplane v2 [resource-type] syntax" - CHECK PUBLICATION DATES
4. **Reference index**: `.kiro/reference/crossplane/index.md` (navigation hub)

### When Crossplane Isn't Working:
- **Providers not installing**: `.kiro/reference/crossplane/provider-troubleshooting.md`
- **Missing CRDs/APIs**: Check provider-troubleshooting.md first
- **"No matches for kind" errors**: Provider architecture issue - see troubleshooting

## 📋 ADDITIONAL RULES

### AWS CLI Pager
**ALWAYS use `--no-cli-pager` flag. NEVER allow interactive pager.**

### Enforcement
**MANDATORY. NON-NEGOTIABLE.**
- Always ask: "Should I mark this task complete?" and "Should I commit these changes?"
- Wait for explicit user response before proceeding
