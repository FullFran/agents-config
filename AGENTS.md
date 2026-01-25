# Repository Guidelines

## Overview

This repository contains an AI-assisted programming framework designed to optimize the collaboration between human developers and AI agents.

## Core Principles

1. **Machine-Readable Documentation**: Priority is given to structured `.md` files that agents can easily parse (max 500 lines per file).
2. **Modular Architecture**: Use nested `AGENTS.md` in subdirectories for granular context.
3. **Skill-Based Competence**: Capabilities are organized into modular "skills" following the `agentskills.io` standard.
4. **Auto-Invocation**: Agents are explicitly instructed on when to load specific skills via triggers.

## Project Structure

- `docs/`: Technical documentation and research.
- `.agent/`: Antigravity-specific configuration.
  - `skills/`: Reusable agent competencies.
  - `rules/`: Project behavioral guidelines.
  - `workflows/`: Automated task sequences.
- `scripts/`: Tooling for framework setup and maintenance.

## Available Skills

| Skill | Description | URL |
|-------|-------------|-----|
| `docs-standard` | Standard for creating technical documentation in this repository. Use this when writing new documentation in docs/ to ensure consistent hierarchy and formatting. | [.agent/skills/docs-standard/SKILL.md](.agent/skills/docs-standard/SKILL.md) |
| `skill-creator` | Create and initialize new Agent Skills following the agentskills.io standard. Use this when you need to modularize a new capability for the AI agent. | [.agent/skills/skill-creator/SKILL.md](.agent/skills/skill-creator/SKILL.md) |
| `workflow-creator` | Create new Antigravity workflows to automate repetitive tasks. Use this when the user wants to formalize a multi-step process into an automated workflow. | [.agent/skills/workflow-creator/SKILL.md](.agent/skills/workflow-creator/SKILL.md) |
## Skill Standards (agentskills.io)

All skills in this repository MUST follow the [agentskills.io](https://agentskills.io) specification:
1. **Directory Structure**: `.agent/skills/<skill-name>/SKILL.md`
2. **Naming**: Lowercase alphanumeric and hyphens only (match directory name).
3. **Frontmatter**: Must include `name` and `description`.
4. **Validation**: Run `./scripts/sync-skills.sh` to validate skills.

## Auto-invoke Rules

Cuando realices las siguientes tareas, DEBES cargar la skill correspondiente para asegurar el cumplimiento cultural:

| Creación de nuevas skills | `skill-creator` | "Necesito crear una nueva habilidad" |
| Creación de nuevos workflows | `workflow-creator` | "Necesito crear un nuevo workflow" |
| Sincronización de metadatos | `scripts/sync-skills.sh` | "Actualiza el índice de skills" |
| Documentación técnica | `docs-standard` | "Escribe un nuevo documento en docs/" |

## Technical Stack

- Environment: Linux / Bash
- Standards: `AGENTS.md`, `agentskills.io`
- Tools: Google Antigravity IDE
