# AI-Assisted Programming Framework Design

This framework is designed to bridge the gap between general agent standards (`AGENTS.md`) and Antigravity-specific optimizations.

## Architecture

```mermaid
graph TD
    Root[Project Root] --> AGENTS_MD[AGENTS.md - General Context]
    Root --> AgentDir[.agents/ - Antigravity optimized]

    AgentDir --> Rules[.agents/rules/ - Project Rules]
    AgentDir --> Skills[.agents/skills/ - Specialized Units]
    AgentDir --> Workflows[.agents/workflows/ - Automated Flows]

    Skills --> S1[skill-creator]
    Skills --> S2[custom-skill-n]

    S1 --> SKILL_MD[SKILL.md]
    S1 --> Scripts[scripts/ - Automation tools]
```

## Key Features

- **Centralized Source of Truth**: All behavioral guidance is version-controlled.
- **Multi-IDE Compatible**: Works natively in Antigravity while providing support for others via `AGENTS.md`.
- **Automated Sync**: A script ensures that as new generic skills are added, they are correctly indexed and referenced.
- **Agent Self-Creation**: Agents can use the `skill-creator` skill to expand their own capabilities within the project boundaries.
