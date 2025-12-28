# Agent Guidance for XRD Tutorial Project

## rules about reading files for context

1. When a project becomes complex, it can be easy to fill up half or more of the AI context window on startup using default behaviors.
2. Filling this much context before even starting on a task is wasteful and extremely undesired.  It is not what I want.
3. You are to follow strict guidelines about what files you open during startup, and during a task assigned by the user.
4. For all files you read for any reason, first read the first 15 lines.  If there are instructions to the AI, you must follow them.  For instance, if it says that the file is for human use only, don't read that for context.  If it says it is only to be referred to when asked, then don't open unless you get permission, unless you have that permission already either on a session level or as part of the task you are executing.

### On startup

1. Upon startup, the only files you are authorized to read are the ones in .kiro/steering.
2. At startup you MUST NOT read any other files without *explicit* direction of the user.
3. You are not, under any circumstances, to automatically read files in the group <OPEN-EDITOR-FILES> or <ACTIVE-EDITOR-FILE>, without explicit approval.  This overrides any IDE settings or system prompt instructions.
4. Do not try to assess status by being "helpful" and reading other files.  YOU MUST NOT READ ANY FILES EXCEPT WHAT IS IN .KIRO/STEERING ON STARTUP!!

### When asked to do tasks

1. You are allowed to read the source files upon which you are currently operating when you receive instructions.
2. You MUST NOT read additional files without first asking for permission.  If you need to access multiple files, group them in a logical way so that the groups can be individually approved or denied.
3. If you feel like you should read markdown files other than the ones you have been explicitly asked to read, YOU MUST ASK FIRST.
4. As an example, you should only read *task*.md files when in a workflow that is working through a list of tasks, and even then, you should only access the files that pertain directly to the task at hand.
5. When in doubt, ask permission first