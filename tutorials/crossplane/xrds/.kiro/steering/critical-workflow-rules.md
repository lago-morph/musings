# CRITICAL WORKFLOW RULES

## ⚠️ CROSSPLANE VERSION REQUIREMENTS

**RULE**: This project uses Crossplane v2.1+ EXCLUSIVELY. NEVER use Crossplane v1 patterns or APIs.

**Critical Requirements**:
- **NO Claims**: Crossplane v2 does not use Claims - use direct XR instances instead
- **NO claimNames**: XRDs in v2 do not have claimNames sections
- **Use XRs directly**: Users interact with composite resources (XRs) directly, not through claims
- **Pipeline mode**: Always use Pipeline mode compositions, not legacy Resources mode
- **Function-based**: Prefer composition functions over patch-and-transform when possible

**Web Search Requirement**:
- Crossplane v2.1 was released after the AI model's training cutoff
- **MUST use web search** to verify current Crossplane v2.1 syntax and patterns
- **MUST search** for official Crossplane v2 documentation before implementing
- **NEVER assume** v1 patterns work in v2 - they often don't

**Examples of FORBIDDEN v1 patterns**:
- ❌ Claims (ApiEndpoint claims)
- ❌ claimNames in XRDs
- ❌ Resources mode compositions
- ❌ Old patch syntax without Pipeline mode

**Required v2 patterns**:
- ✅ Direct XR usage (XApiEndpoint instances)
- ✅ Pipeline mode compositions
- ✅ Function-based composition when possible
- ✅ Modern XRD syntax without claimNames

## MANDATORY USER CONFIRMATION REQUIREMENTS

### ⚠️ MANDATORY TASK REQUIREMENT VERIFICATION

**RULE**: AI agents MUST read the complete task description and verify ALL requirements are satisfied before asking for completion approval.

**Required verification steps**:
1. **Read Complete Description**: Review the entire task including:
   - Method (how to do the work)
   - Validation criteria (how to verify success)
   - Purpose (why the task exists)
   - Language requirements (if specified)
   - Output requirements (if specified)
   - Any other listed requirements

2. **Self-Check All Requirements**: Before asking for approval, verify:
   - ✅ Method requirements satisfied
   - ✅ Validation criteria met
   - ✅ Purpose fulfilled
   - ✅ All deliverables created
   - ✅ All testing/verification completed

3. **Present Complete Results**: Show the user:
   - What was accomplished
   - How each requirement was satisfied
   - Evidence that validation criteria are met

**Example of proper verification**:
```
Task: "Create Crossplane manifests for prerequisite infrastructure"
- Method: Write YAML manifests for required AWS infrastructure ✅
- Validation: via Crossplane status fields showing Ready ❌ (not applied yet)

Result: Cannot ask for completion approval until manifests are applied and show Ready status.
```

### ⚠️ NEVER START TASKS WITHOUT USER PERMISSION

**RULE**: AI agents MUST NEVER start any new task without explicit user permission first.

**Process**:
1. Complete current task work
2. Present results to user
3. **WAIT** for explicit instruction on what to do next
4. Only start new tasks when user explicitly says "start task X" or equivalent

**Examples of what requires permission**:
- Starting any numbered task (3.1.1, 3.2.1, etc.)
- Beginning work on the next sequential task
- Reading task requirements for tasks not explicitly assigned

**What NOT to do**:
- ❌ Automatically start the next task after completing one
- ❌ Assume the user wants you to continue to the next task
- ❌ Begin working on tasks without explicit instruction

### ⚠️ NEVER MARK TASKS COMPLETE WITHOUT USER CONFIRMATION

**RULE**: AI agents MUST NEVER mark any task as complete without explicit user confirmation first.

**Process**:
1. **READ THE COMPLETE TASK DESCRIPTION** including method, validation criteria, purpose, and any other requirements
2. Complete the work for a task
3. **DOUBLE-CHECK ALL REQUIREMENTS** - verify that you have satisfied every single requirement listed in the task description
4. Present the results to the user
5. **WAIT** for explicit user confirmation before marking task complete
6. Only after user says "yes", "approved", "looks good", or equivalent, then mark the task as complete

**Examples of what requires confirmation**:
- Completing any numbered task (3.1.1, 3.2.1, etc.)
- Completing any major task group (3.1, 3.2, 3.3, etc.)
- Any task status change from "in progress" to "completed"

**What NOT to do**:
- ❌ Mark task complete immediately after doing the work
- ❌ Assume the user approves without asking
- ❌ Mark multiple tasks complete in sequence without individual confirmation
- ❌ Skip reading the complete task description
- ❌ Ignore validation criteria or other requirements
- ❌ Ask for approval when requirements are not fully satisfied

### ⚠️ NEVER COMMIT TO GIT WITHOUT USER CONFIRMATION

**RULE**: AI agents MUST NEVER commit code to git without explicit user confirmation first.

**Process**:
1. Complete code changes
2. Present the changes to the user
3. **WAIT** for explicit user confirmation before committing
4. Only after user says "commit this", "looks good to commit", or equivalent, then commit

**Examples of what requires confirmation**:
- Any `git add` and `git commit` operations
- Any `git push` operations
- Any git repository modifications

**What NOT to do**:
- ❌ Automatically commit after completing work
- ❌ Assume the user wants changes committed
- ❌ Commit without showing the user what will be committed

## ENFORCEMENT

These rules are **MANDATORY** and **NON-NEGOTIABLE**.

**Violation consequences**:
- User will stop the agent and require restart
- Work may need to be redone
- Trust in the agent's workflow adherence is damaged

**Compliance verification**:
- Always ask "Should I mark this task as complete?" before changing task status
- Always ask "Should I commit these changes?" before any git operations
- Wait for explicit user response before proceeding

## EXAMPLES

### ✅ CORRECT Task Completion Flow
```
Agent: I've completed task 3.2.1 by creating the ApiEndpoint XRD. The XRD validates successfully and includes the required spec and status schemas. Should I mark task 3.2.1 as complete?

User: Yes, looks good.

Agent: [marks task complete]
```

### ❌ INCORRECT Task Completion Flow
```
Agent: I've completed task 3.2.1 by creating the ApiEndpoint XRD. [immediately marks task complete without asking]
```

### ✅ CORRECT Git Commit Flow
```
Agent: I've created the ApiEndpoint XRD and verification scripts. Here are the files that would be committed:
- xrd-apiendpoint.yaml
- test-apiendpoint.sh

Should I commit these changes?

User: Yes, commit them.

Agent: [commits to git]
```

### ❌ INCORRECT Git Commit Flow
```
Agent: I've created the ApiEndpoint XRD. [immediately commits without asking]
```

## SUMMARY

**ALWAYS VERIFY FIRST**:
- Read the complete task description including all requirements
- Double-check that ALL requirements are satisfied before asking for approval
- "Should I mark this task as complete?" (only after full verification)
- "Should I commit these changes?"

**NEVER ASSUME**:
- That partial completion satisfies the task
- That work is acceptable without user review
- That the user wants tasks marked complete
- That the user wants changes committed
- That you understand requirements without reading them completely

This ensures proper user control over the workflow and prevents unwanted automatic actions.