# Agents Config (Agentic-First Framework)

Framework multi-agente para desarrollo asistido por IA. Una sola fuente de verdad, compatible con todos los IDEs y agentes de terminal.

## Agentes Soportados

| Agente | Comando | Archivo generado |
|--------|---------|------------------|
| OpenCode TUI | `--opencode` | `.opencode/` + `opencode.json` |
| Claude Code | `--claude` | `.claude/` + `CLAUDE.md` |
| Cursor | `--cursor` | `.cursorrules` |
| GitHub Copilot | `--copilot` | `.github/copilot-instructions.md` |
| Antigravity IDE | `--antigravity` | `GEMINI.md` |

---

## Quick Start

```bash
# 1. Clona el repo
git clone <repo>
cd <repo>

# 2. Configura tu agente (modo interactivo)
./scripts/setup-agents.sh

# O configura uno específico
./scripts/setup-agents.sh --opencode
./scripts/setup-agents.sh --antigravity
./scripts/setup-agents.sh --all
```

---

## Arquitectura

```
📁 Proyecto
├── AGENTS.md              ← Fuente de verdad (SE COMMITEA)
├── .agent/                ← Skills, rules, workflows (SE COMMITEA)
│   ├── skills/            ← Habilidades modulares (agentskills.io)
│   ├── rules/             ← Reglas de arquitectura/estilo
│   └── workflows/         ← Automatizaciones (slash commands)
│
│   ─── GENERADOS (symlinks, en .gitignore) ───
├── CLAUDE.md              → AGENTS.md
├── GEMINI.md              → AGENTS.md
├── .cursorrules           → AGENTS.md
├── .github/copilot-instr. → AGENTS.md
├── .opencode/skills/*     → .agent/skills/*
├── .opencode/commands/*   → .agent/workflows/* (Slash Commands)
└── .claude/skills         → .agent/skills
```

### Fuente de Verdad

Solo se commitean dos cosas:

1. **`AGENTS.md`**: Instrucciones generales del proyecto para cualquier agente IA.
2. **`.agent/`**: El cerebro modular (Skills siguiendo el estándar `agentskills.io`, reglas y workflows).

Todo lo demás se genera localmente con symlinks. Si modificas la fuente de verdad, todos los agentes ven el cambio automáticamente.

---

## Cómo Funciona

### Para el desarrollador

1. **Clona el repo** y ejecuta `./scripts/setup-agents.sh`.
2. **Elige tu agente** (OpenCode, Antigravity, Claude, etc.).
3. **Trabaja normalmente**: El agente ya tiene todo el contexto, habilidades y comandos personalizados.

### Para el mantenedor

1. **Edita `AGENTS.md`** para cambiar instrucciones globales.
2. **Crea skills en `.agent/skills/`** para capacidades específicas (validadas por script).
3. **Crea workflows en `.agent/workflows/`** que se convierten en comandos `/slash` para OpenCode y Antigravity.
4. **Ejecuta `./scripts/sync-skills.sh`** para mantener todo en sincronía y validar estándares.

---

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `./scripts/setup-agents.sh` | Configura agentes (interactivo o con flags). Crea symlinks locales. |
| `./scripts/sync-skills.sh` | Valida skills (`agentskills.io`) y sincroniza metadatos y comandos. |

---

## Crear una Skill Nueva

```bash
# 1. Crea el directorio
mkdir -p .agent/skills/mi-skill

# 2. Crea el archivo SKILL.md (Usa la skill 'skill-creator' para ayuda)
# MUST: name coincida con carpeta, descripción < 1024 chars.

# 3. Sincroniza y Valida
./scripts/sync-skills.sh
```

---

## Workflows y Slash Commands

Los archivos en `.agent/workflows/*.md` se mapean automáticamente como comandos en los agentes compatibles (como OpenCode).
- Ejemplo: `create-skill.md` se convierte en el comando `/create-skill` en la TUI.

---

## FAQ

### ¿Por qué symlinks en vez de copias?
Para que al modificar la fuente de verdad todos los agentes vean el cambio al instante sin re-ejecutar scripts.

### ¿Qué pasa si agrego una skill o workflow nuevo?
Ejecuta `./scripts/sync-skills.sh`. El script detectará tus agentes activos y creará los symlinks necesarios automáticamente.

---

## Estándares Utilizados

- **Persona**: `AGENTS.md` (Standard de instrucciones para agentes).
- **Skills**: `agentskills.io` (Estructura modular de habilidades).
- **Workflows**: Estándar nativo de Antigravity / OpenCode Commands.
- **Scripts**: Bash (Sincronización y validación automática).
