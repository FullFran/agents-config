import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import { join, basename } from 'path';

const REPO_ROOT = process.cwd();
const AGENTS_DIR = join(REPO_ROOT, '.agents');
const SKILLS_DIR = join(AGENTS_DIR, 'skills');
const WORKFLOWS_DIR = join(AGENTS_DIR, 'workflows');
const RULES_DIR = join(AGENTS_DIR, 'rules');
const PERSONAS_DIR = join(AGENTS_DIR, 'agents');
const AGENTS_MD = join(REPO_ROOT, 'AGENTS.md');

const AGENT_FOLDERS = [
  { name: 'OpenCode', path: '.opencode' },
  { name: 'Antigravity', path: '.agent' },
  { name: 'Claude', path: '.claude' }
];

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const frontmatter = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

export async function reconcileResources(root) {
  let importsCount = 0;
  const centralSkills = join(root, '.agents/skills');
  const centralWorkflows = join(root, '.agents/workflows');

  for (const agent of AGENT_FOLDERS) {
    const agentPath = join(root, agent.path);
    if (!(await fs.pathExists(agentPath))) continue;

    const agentSkillsPath = join(agentPath, 'skills');
    if (await fs.pathExists(agentSkillsPath)) {
      const skills = await fs.readdir(agentSkillsPath, { withFileTypes: true });
      for (const dirent of skills) {
        if (!dirent.isDirectory()) continue;
        const targetPath = join(agentSkillsPath, dirent.name);
        const sourcePath = join(centralSkills, dirent.name);
        
        // SEGURIDAD: Si es un symlink, ignorar (ya está vinculado)
        const lstat = await fs.lstat(targetPath);
        if (lstat.isSymbolicLink()) continue;

        if (!(await fs.pathExists(sourcePath))) {
          await fs.copy(targetPath, sourcePath);
          importsCount++;
        }
      }
    }

    const agentWorkflowsPath = join(agentPath, agent.path === '.agent' ? 'workflows' : 'commands');
    if (await fs.pathExists(agentWorkflowsPath)) {
      const workflows = await fs.readdir(agentWorkflowsPath);
      for (const file of workflows) {
        if (!file.endsWith('.md')) continue;
        const targetPath = join(agentWorkflowsPath, file);
        const sourcePath = join(centralWorkflows, file);

        // SEGURIDAD: Si es un symlink, ignorar
        const lstat = await fs.lstat(targetPath);
        if (lstat.isSymbolicLink()) continue;

        if (!(await fs.pathExists(sourcePath))) {
          await fs.copy(targetPath, sourcePath);
          importsCount++;
        }
      }
    }
  }
  return importsCount;
}

async function scanSkills(root) {
  const dir = join(root, '.agents/skills');
  const skills = [];
  if (!(await fs.pathExists(dir))) return skills;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of entries) {
    if (dirent.isDirectory()) {
      const md = join(dir, dirent.name, 'SKILL.md');
      if (await fs.pathExists(md)) {
        const fm = parseFrontmatter(await fs.readFile(md, 'utf-8'));
        if (fm.name === dirent.name) {
          skills.push({ 
            name: fm.name, 
            description: fm.description || 'No description', 
            path: `.agents/skills/${fm.name}/SKILL.md` 
          });
        }
      }
    }
  }
  return skills;
}

async function scanWorkflows(root) {
  const dir = join(root, '.agents/workflows');
  const workflows = [];
  if (!(await fs.pathExists(dir))) return workflows;
  const files = await fs.readdir(dir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const content = await fs.readFile(join(dir, file), 'utf-8');
      const fm = parseFrontmatter(content);
      workflows.push({ 
        name: file.replace('.md', ''), 
        description: fm.description || 'No description', 
        path: `.agents/workflows/${file}` 
      });
    }
  }
  return workflows;
}

async function scanPersonas(root) {
  const dir = join(root, '.agents/agents');
  const personas = [];
  if (!(await fs.pathExists(dir))) return personas;
  const files = await fs.readdir(dir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const content = await fs.readFile(join(dir, file), 'utf-8');
      const fm = parseFrontmatter(content);
      personas.push({ 
        name: fm.name || file.replace('.md', ''), 
        description: fm.description || 'No description', 
        path: `.agents/agents/${file}` 
      });
    }
  }
  return personas;
}

export function generateTable(items, columns) {
  if (items.length === 0) return '_None configured_\n';
  let table = '| ' + columns.map(c => c.header).join(' | ') + ' |\n';
  table += '|' + columns.map(() => '------').join('|') + '|\n';
  for (const item of items) {
    const row = columns.map(c => {
      const val = item[c.key];
      if (c.key === 'name') return `\`${val}\``;
      if (c.key === 'path') return `[${val}](${val})`;
      return val;
    });
    table += '| ' + row.join(' | ') + ' |\n';
  }
  return table;
}

function updateSection(content, sectionHeader, newContent) {
  const headerRegex = new RegExp(`(## ${sectionHeader})\\n[\\s\\S]*?(?=\\n## |$)`);
  if (content.match(headerRegex)) {
    return content.replace(headerRegex, `$1\n\n${newContent}\n`);
  }
  const securityIndex = content.indexOf('## Security');
  if (securityIndex > 0) {
    return content.slice(0, securityIndex) + `## ${sectionHeader}\n\n${newContent}\n\n` + content.slice(securityIndex);
  }
  return content + `\n## ${sectionHeader}\n\n${newContent}\n`;
}

export async function sync() {
  p.intro(`${pc.magenta(pc.bold('🔄 AGENTS SYNC & RECONCILE'))}`);
  const s = p.spinner();
  try {
    s.start('Reconciliando recursos...');
    const imported = await reconcileResources(REPO_ROOT);
    s.stop(imported > 0 ? pc.green(`Sincronización completa: ${imported} nuevos.`) : pc.dim('Al día.'));

    s.start('Generando documentación...');
    const [skills, workflows, personas] = await Promise.all([
      scanSkills(REPO_ROOT),
      scanWorkflows(REPO_ROOT),
      scanPersonas(REPO_ROOT)
    ]);

    if (await fs.pathExists(AGENTS_MD)) {
      let content = await fs.readFile(AGENTS_MD, 'utf-8');
      content = updateSection(content, 'Available Skills', generateTable(skills, [{header:'Skill', key:'name'}, {header:'Description', key:'description'}, {header:'Path', key:'path'}]));
      content = updateSection(content, 'Workflows \\(Slash Commands\\)', generateTable(workflows, [{header:'Workflow', key:'name'}, {header:'Description', key:'description'}, {header:'Path', key:'path'}]));
      content = updateSection(content, 'Personas', generateTable(personas, [{header:'Persona', key:'name'}, {header:'Description', key:'description'}, {header:'Path', key:'path'}]));
      await fs.writeFile(AGENTS_MD, content);
      s.stop(pc.green('AGENTS.md actualizado.'));
    } else {
      s.stop(pc.yellow('AGENTS.md no encontrado.'));
    }

    p.log.info(`${pc.cyan('Skills:')} ${skills.length} | ${pc.cyan('Workflows:')} ${workflows.length} | ${pc.cyan('Personas:')} ${personas.length}`);
  } catch (e) {
    s.stop(pc.red('Fallo en la sincronización.'));
    console.error(e);
  }
  p.outro(pc.bold('✅ Listo!'));
}
