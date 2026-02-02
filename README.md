# AI-Assisted Programming Framework 🤖

Plantilla estándar para gestionar configuraciones de agentes de IA (OpenCode, Antigravity, Claude Code, Cursor, Copilot) en proyectos de equipo. Asegura que todos los miembros usen las mismas reglas, skills y workflows, independientemente del agente que prefieran.

## 🚀 Inicio Rápido (en un proyecto nuevo)

Puedes instalar y configurar este framework en cualquier repositorio ejecutando:

```bash
npx @fullfran/agents-config init
```

Esto lanzará un asistente interactivo para elegir tus agentes, skills y el modo de instalación.

## 🛠️ Comandos de Mantenimiento

Una vez instalado, usa estos comandos para mantener el framework:

- `npm run sync`: **Sincronización Bidireccional**. 
  - Escanea `.opencode/`, `.agent/` y `.claude/` buscando nuevos recursos.
  - Importa cualquier skill o workflow nuevo a la fuente de verdad (`.agents/`).
  - Actualiza automáticamente las tablas en `AGENTS.md`.
- `npm run add-skill`: Crea una nueva competencia estructurada.
- `npm run add-workflow`: Crea un nuevo comando slash interactivo.
- `npm run init`: Re-configura agentes o habilita nuevos recursos.

## 👥 Flujo de Trabajo en Equipo

El framework está diseñado para la colaboración multiplataforma:

1. **Si usas OpenCode**: Edita tus archivos en `.opencode/`.
2. **Si usas Antigravity**: Edita tus archivos en `.agent/`.
3. **Sincronización**: Antes de hacer commit, cualquier miembro del equipo ejecuta `npm run sync`.
   - Si creaste un skill nuevo en `.agent/skills/mi-skill`, el comando `sync` lo detectará y lo moverá a la carpeta central `.agents/skills/`.
   - Al hacer commit de `.agents/`, el resto del equipo recibirá la actualización.
   - Ellos solo tendrán que correr `npm run init` (o `sync`) para tener ese nuevo skill disponible en sus respectivos agentes.

## 🏗️ Estructura del Proyecto

- `.agents/`: **Fuente de Verdad**. Aquí vive la configuración real.
  - `skills/`: Capacidades modulares (`SKILL.md`).
  - `workflows/`: Comandos slash (`.md`).
  - `agents/`: Personas y estilos de respuesta.
  - `rules/`: Reglas globales del proyecto.
- `AGENTS.md`: Documentación generada automáticamente que los agentes de IA leen para entender sus capacidades.
- `.opencode/`, `.agent/`, `.claude/`: Carpetas generadas (normalmente symlinks) que cada herramienta usa localmente.

## 💡 Recomendaciones

- **Modo Modular**: Instala siempre en modo modular (usando symlinks). Es lo que permite que los cambios en las carpetas de los agentes se reflejen instantáneamente en la fuente de verdad.
- **Git**: El archivo `.gitignore` generado ignorará las carpetas específicas de los agentes, manteniendo el repositorio limpio y solo trackeando la carpeta central `.agents/`.

---
Creado por **FullFran** para equipos de desarrollo modernos.
