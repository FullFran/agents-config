# AGENTS.md Standard

`AGENTS.md` is an emerging open standard designed to serve as a **machine-readable README for AI coding agents**.

## Purpose

While a `README.md` is designed for humans, `AGENTS.md` provides critical context, instructions, and rules specifically for AI agents (like Antigravity, Claude Code, or Cursor) to help them understand and interact with a codebase more effectively.

## Key Components

- **Persona**: Defines how the agent should behave and its areas of expertise.
- **Tech Stack**: Explicitly lists the languages, frameworks, and libraries used.
- **File Structure**: Explains the organization of the repository.
- **Workflow Instructions**: Step-by-step guides for common tasks (build, test, deploy).
- **Rules & Boundaries**: What the agent MUST or MUST NOT do.

## Nested Strategy

In large projects or monorepos, `AGENTS.md` files can be nested (e.g., `ui/AGENTS.md`, `api/AGENTS.md`). Deeply nested files inherit from the root `AGENTS.md` but can override specific instructions for that sub-directory.

## Benefits

- **Reduced Context Window Consumption**: By providing clear, condensed instructions.
- **Improved Performance**: Agents are less likely to hallucinate when given explicit guidelines.
- **Interoperability**: One file can guide multiple different AI tools.
