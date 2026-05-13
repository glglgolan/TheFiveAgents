---
name: obsidian-vault-workflow
description: Use at the start of every session and when receiving any command - scans project files and maintains an Obsidian-style vault with wiki-linked MD documentation per file, organized by agent/role
---

# Obsidian Vault Workflow

## Overview

Maintain a living Obsidian-style knowledge base that documents every file in the project.
At session start and on each command, scan for new/changed files and update the vault.

**Core principle:** Every file deserves one MD note. Notes link each other with `[[wiki-links]]`.

## When to Use

- **At the start of every session** — run before anything else
- **After receiving a command** — check if new files were added since last run
- **After creating/modifying files** — update relevant vault notes

## Vault Structure

```
obsidian-vault/
  00-INDEX.md          ← master index, links to everything
  Project-Overview.md  ← project identity, team, purpose
  agents/              ← one note per agent/role
  skills/              ← one note per skill
  config/              ← one note per config/env file
```

## Note Format

Every note MUST follow this template:

```markdown
# [File/Folder Name]

## מה זה עושה
One paragraph describing the file's purpose.

## שייך ל
Agent or role that owns/uses this file.

## קבצים קשורים
- [[Related-File-1]]
- [[Related-File-2]]

## מיקום
`relative/path/to/file`
```

## Workflow Steps

1. **Scan** — list all non-git, non-DS_Store files in the project
2. **Diff** — compare against existing vault notes (by path in frontmatter)
3. **Create** — write a new note for every undocumented file
4. **Update** — refresh notes for files that changed since last vault update
5. **Reindex** — regenerate `00-INDEX.md` with links to every note

## Frontmatter (add to every note)

```yaml
---
file_path: relative/path/to/file
last_updated: YYYY-MM-DD
owner: agent-name or "project"
---
```

## Linking Rules

- Use `[[Note-Name]]` for cross-references (no file extension)
- Note names = filename without extension, spaces as hyphens
- Every skill note links to: skills that trigger it, skills it calls
- Every agent note links to: skills the agent relies on, config it reads
- Config notes link to: agents that read them

## On Session Start

Before any other action in a new session:
1. Check if `obsidian-vault/` exists; if not, create full structure
2. Scan for files not yet documented → create missing notes
3. Report to user: "Vault updated: N new notes, M updated"
