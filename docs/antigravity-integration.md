# Antigravity Integration Guidelines

Google Antigravity is an agent-first IDE that uses specific directory structures and markdown files to guide its autonomous agents.

## Core Mechanisms

### 1. Skills (`.agent/skills/`)

A "Skill" is a reusable unit of competence.

- **Structure**: Each skill is a folder containing a `SKILL.md` file.
- **Trigger**: Skills are loaded based on the `description` and `metadata` (frontmatter) in the `SKILL.md`.
- **Progressive Disclosure**: Antigravity only loads the relevant skills for the current task, keeping the context window clean.

### 2. Rules (`.agent/rules/`)

Rules are project-specific guidelines that agents MUST follow.

- **Location**: `.agent/rules/*.md`.
- **Purpose**: Defining coding styles, naming conventions, and architectural rules.

### 3. Workflows (`.agent/workflows/`)

Workflows are structured steps for achieving complex outcomes.

- **Format**: Markdown files with YAML frontmatter.
- **Automation**: Can contain commands that agents run (with user approval or auto-run flags).

## Synergy with AGENTS.md

While `AGENTS.md` provides a broad overview for various IDEs, Antigravity prioritizes its native `.agent/` directory for high-precision task execution. Our framework ensures both are kept in sync.
