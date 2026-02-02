# AGENTS.md - AI-Assisted Programming Framework Guidelines

## Project Overview
This repository contains a specialized framework for configuring and managing AI agents (OpenCode, Claude, Copilot, Cursor, Antigravity). It uses a modular "Skill" architecture following the `agentskills.io` standard to provide agents with contextual capabilities and behavioral rules.

## Technical Stack
- **Runtime**: Node.js (v18+)
- **Module System**: ESM (ECMAScript Modules)
- **CLI Framework**: Commander.js
- **UI/UX**: @clack/prompts (Interactive prompts and spinners)
- **Styling**: picocolors (Themed console output)
- **File System**: fs-extra (Async-first file operations)

## Operational Commands

### Development & Maintenance
```bash
# Install dependencies
npm install

# Start the interactive setup (CLI entry point)
npm run init

# Sync all metadata to AGENTS.md (skills, workflows, personas, rules)
npm run sync

# Add a new skill interactively
npm run add-skill

# Add a new workflow (slash command) interactively
npm run add-workflow
```

### Testing & Verification
Currently, the project uses a placeholder for tests. When adding new features, you MUST verify them manually or add unit tests.
```bash
# Run tests (placeholder)
npm test

# Run a specific test (example if using mocha/jest)
# npm test -- tests/unit/setup.test.js

# Verify code style and ESM compatibility
node bin/cli.js --version
```

## Code Style & Guidelines

### 1. Imports & ESM
- Use explicit ESM imports. Always include the `.js` extension for local file imports.
- Order imports: 
  1. Standard Node modules (`path`, `url`, etc.)
  2. Third-party libraries (`@clack/prompts`, `fs-extra`)
  3. Local modules (`./commands/...`)
- Use `fileURLToPath` and `dirname` to handle `__dirname` in ESM.
- Avoid CommonJS `require` and `module.exports`.

### 2. Async/Await Patterns
- All file system operations MUST be asynchronous using `fs-extra`.
- Use `try...catch` blocks for all I/O operations and CLI actions.
- Properly handle process cancellation using `p.isCancel(result)` from `@clack/prompts`.
- Avoid synchronous methods like `readFileSync` unless absolutely necessary (e.g. in top-level bootstrap code).

### 3. Naming Conventions
- **Files**: `kebab-case.js` for commands and utils.
- **Variables/Functions**: `camelCase` (e.g., `installMode`, `applyConfig`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `REPO_ROOT`, `PACKAGE_ROOT`).
- **Classes**: `PascalCase` if any are implemented.

### 4. UI & Console Output
- Use `@clack/prompts` for ALL interactive elements (`intro`, `select`, `multiselect`, `spinner`, `outro`).
- Apply semantic colors using `picocolors`:
  - `pc.magenta` for primary branding.
  - `pc.green` for success messages.
  - `pc.yellow` for warnings.
  - `pc.red` for errors.
  - `pc.dim` for hints and secondary info.

### 5. Error Handling
- Throw descriptive errors with context.
- Log warnings to the user using `p.log.warn` or `console.error` before exiting.
- Ensure backups are created before overwriting user configurations (as seen in `setup.js`).
- Gracefully handle `ENOENT` and other common filesystem errors.

## Project Structure
- `bin/cli.js`: Entry point for the `agents-config` CLI tool.
- `src/commands/`: Implementation of CLI commands (`setup.js`, `sync.js`).
- `.agents/`: Source of truth for all agent configurations.
  - `skills/`: Modular competencies (each with `SKILL.md`).
  - `rules/`: Global and agent-specific behavioral rules.
  - `agents/`: Markdown personas (e.g., `@senior-architect`).
  - `workflows/`: Automated task sequences (Slash Commands).
- `docs/`: Technical documentation and design specs.

## Available Skills

| Skill | Description | Path |
|------|------|------|
| `architecture-decision-record` | Help the team document and maintain Architecture Decision Records (ADRs). | [.agents/skills/architecture-decision-record/SKILL.md](.agents/skills/architecture-decision-record/SKILL.md) |
| `docs-standard` | Standard for creating technical documentation in this repository. Use this when writing new documentation in docs/ to ensure consistent hierarchy and formatting. | [.agents/skills/docs-standard/SKILL.md](.agents/skills/docs-standard/SKILL.md) |
| `mermaid-diagrams` | Expert guidance on creating accurate, visually polished Mermaid diagrams for architecture documentation. | [.agents/skills/mermaid-diagrams/SKILL.md](.agents/skills/mermaid-diagrams/SKILL.md) |
| `skill-creator` | Create and initialize new Agent Skills following the agentskills.io standard. Use this when you need to modularize a new capability for the AI agent. | [.agents/skills/skill-creator/SKILL.md](.agents/skills/skill-creator/SKILL.md) |
| `workflow-creator` | Create new Antigravity workflows to automate repetitive tasks. Use this when the user wants to formalize a multi-step process into an automated workflow. | [.agents/skills/workflow-creator/SKILL.md](.agents/skills/workflow-creator/SKILL.md) |


## Workflows (Slash Commands)

| Workflow | Description | Path |
|------|------|------|
| `commit` | Create a new git commit for uncommitted changes following atomic standards | [.agents/workflows/commit.md](.agents/workflows/commit.md) |
| `create-skill` | Automated workflow to create a new AI Skill | [.agents/workflows/create-skill.md](.agents/workflows/create-skill.md) |
| `create-workflow` | Automated workflow to create a new slash command workflow | [.agents/workflows/create-workflow.md](.agents/workflows/create-workflow.md) |
| `debug` | Structured debugging process to identify and fix bugs | [.agents/workflows/debug.md](.agents/workflows/debug.md) |
| `review` | Perform a deep code review of pending changes | [.agents/workflows/review.md](.agents/workflows/review.md) |


## Personas

| Persona | Description | Path |
|------|------|------|
| `code-ninja` | Concise, code-first persona for fast implementation. | [.agents/agents/code-ninja.md](.agents/agents/code-ninja.md) |
| `senior-architect` | Senior Architect persona - helpful first, challenging when it matters. | [.agents/agents/senior-architect.md](.agents/agents/senior-architect.md) |


## Security & Permissions
- NEVER commit or log secrets (API keys, tokens).
- Access to `*.env` files is strictly denied in agent configurations.
- Git operations (`commit`, `push`) must require user confirmation.
- Use `fs.writeJson` with proper indentation for configuration files.

## Core Mandates
1. **Consistency**: Mimic the style and architecture of `setup.js`.
2. **Safety**: Always check for directory existence before file operations.
3. **Modularity**: Keep logic in `src/commands` and use the CLI as a thin wrapper.
4. **Documentation**: Update `AGENTS.md` and run `sync` whenever skills change.
5. **Quality**: Ensure all interactive steps handle cancellation (`p.isCancel`).
6. **Robustness**: Use `fs.ensureDir` before writing to nested paths.

## Contribution Workflow
When adding a new feature or command:
1. Create a new file in `src/commands/` if it's a major feature.
2. Update `bin/cli.js` to register the new command.
3. Ensure all new logic is `async` and uses the provided UI utilities.
4. Run `npm run sync` to ensure the framework documentation remains up-to-date.
5. Verify the changes by running the CLI tool locally.
