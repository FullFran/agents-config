# Antigravity Integration Guidelines

Google Antigravity is an agent-first IDE that uses specific directory structures and markdown files to guide its autonomous agents.

## Core Mechanisms

### 1. Skills (`.agents/skills/`)

A "Skill" is a reusable unit of competence.

- **Structure**: Each skill is a folder containing a `SKILL.md` file.
- **Trigger**: Skills are loaded based on the `description` and `metadata` (frontmatter) in the `SKILL.md`.
- **Progressive Disclosure**: Antigravity only loads the relevant skills for the current task, keeping the context window clean.

### 2. Rules (`.agents/rules/`)

Rules are project-specific guidelines that agents MUST follow.

- **Location**: `.agents/rules/*.md`.
- **Purpose**: Defining coding styles, naming conventions, and architectural rules.

### 3. Workflows (`.agents/workflows/`)

Workflows are structured steps for achieving complex outcomes.

- **Format**: Markdown files with YAML frontmatter.
- **Automation**: Can contain commands that agents run (with user approval or auto-run flags).

### 4. Personas (`.agents/agents/`)

Personas allow changing the agent's output style and behavioral traits.

- **Usage**: Mention a persona using `@name` (e.g., `@code-ninja`) to ask the agent to adopt that personality.
- **Location**: Defined in `.agents/agents/*.md`.

## Synergy with AGENTS.md

While `AGENTS.md` provides a broad overview for various IDEs, Antigravity prioritizes its native `.agents/` directory for high-precision task execution. Our framework ensures both are kept in sync.
