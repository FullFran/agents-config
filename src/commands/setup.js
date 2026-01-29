import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '../..');

// Source of truth can be local or from the package
let SOURCE_DIR = join(REPO_ROOT, '.agents');

async function ensureSource(installMode) {
  if (installMode === 'modular') {
    if (!(await fs.pathExists(SOURCE_DIR))) {
      await fs.copy(join(PACKAGE_ROOT, '.agents'), SOURCE_DIR);
      await fs.copy(join(PACKAGE_ROOT, 'AGENTS.md'), join(REPO_ROOT, 'AGENTS.md'));
    }
  } else {
    // In standalone mode, we use the package's own .agents as source
    SOURCE_DIR = join(PACKAGE_ROOT, '.agents');
  }
}

async function applyConfig(target, sourceRel, installMode, forceAll = false) {
  const targetAbs = join(REPO_ROOT, target);
  
  // Limpiamos la ruta de origen para evitar duplicados como .agents/.agents
  const cleanSourceRel = sourceRel.startsWith('.agents/') 
    ? sourceRel.substring(8) 
    : sourceRel === '.agents' ? '' : sourceRel;

  const sourceAbs = join(
    installMode === 'modular' ? join(REPO_ROOT, '.agents') : join(PACKAGE_ROOT, '.agents'), 
    cleanSourceRel
  );
  
  // Handle AGENTS.md special case
  const finalSourceAbs = sourceRel === 'AGENTS.md' 
    ? (installMode === 'modular' ? join(REPO_ROOT, 'AGENTS.md') : join(PACKAGE_ROOT, 'AGENTS.md'))
    : sourceAbs;

  if (!(await fs.pathExists(finalSourceAbs))) {
    // Si la fuente no existe, es un error crítico del paquete o del repo
    throw new Error(`Source path missing: ${finalSourceAbs}`);
  }

  await fs.ensureDir(dirname(targetAbs));
  
  const exists = await fs.pathExists(targetAbs);
  if (exists && !forceAll) {
    try {
      const lstat = await fs.lstat(targetAbs);
      if (!lstat.isSymbolicLink()) {
        // Es un archivo/carpeta real del usuario. ¡BACKUP!
        const backupPath = `${targetAbs}.backup-${Date.now()}`;
        await fs.move(targetAbs, backupPath);
        p.log.warn(`${pc.yellow('⚠')} Existing ${pc.bold(target)} moved to ${pc.dim(backupPath)}`);
      }
    } catch (e) {
      // Ignore errors during stat
    }
  }

  // Ahora procedemos seguros (fs.remove limpia symlinks rotos, archivos y carpetas)
  await fs.remove(targetAbs); 

  if (installMode === 'modular') {
    const relTarget = relative(dirname(targetAbs), finalSourceAbs);
    const type = (await fs.stat(finalSourceAbs)).isDirectory() ? 'dir' : 'file';
    await fs.symlink(relTarget, targetAbs, type);
  } else {
    await fs.copy(finalSourceAbs, targetAbs);
  }
}

export async function setup() {
  p.intro(`${pc.magenta(pc.bold('🤖 AGENTS CONFIG SETUP'))} ${pc.dim('by FullFran')}`);

  const installMode = await p.select({
    message: 'Choose installation mode:',
    options: [
      { value: 'modular', label: 'Modular (Recommended)', hint: 'Keeps .agents/ folder + symlinks. Best for customization.' },
      { value: 'standalone', label: 'Standalone', hint: 'Copies files directly. No .agents/ folder needed in your repo.' },
    ],
  });

  if (p.isCancel(installMode)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  await ensureSource(installMode);

  const agents = await p.multiselect({
    message: 'Select agents to configure:',
    options: [
      { value: 'opencode', label: 'OpenCode TUI', hint: '.opencode/' },
      { value: 'claude', label: 'Claude Code', hint: 'CLAUDE.md' },
      { value: 'copilot', label: 'GitHub Copilot', hint: '.github/' },
      { value: 'cursor', label: 'Cursor IDE', hint: '.cursorrules' },
      { value: 'antigravity', label: 'Antigravity IDE', hint: 'GEMINI.md' },
    ],
    required: true,
  });

  if (p.isCancel(agents)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  // Get available skills from SOURCE_DIR
  const skillsPath = join(SOURCE_DIR, 'skills');
  const availableSkills = (await fs.readdir(skillsPath, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => ({ value: dirent.name, label: dirent.name }));

  const selectedSkills = await p.multiselect({
    message: 'Select skills to enable:',
    options: availableSkills,
    required: false,
  });

  if (p.isCancel(selectedSkills)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  // Get available personas from SOURCE_DIR
  const personasPath = join(SOURCE_DIR, 'agents');
  const availablePersonas = (await fs.readdir(personasPath))
    .filter(file => file.endsWith('.md'))
    .map(file => ({ value: file, label: file.replace('.md', '') }));

  const selectedPersonas = await p.multiselect({
    message: 'Select personas to enable:',
    options: availablePersonas,
    required: false,
  });

  if (p.isCancel(selectedPersonas)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  // Get available workflows from SOURCE_DIR
  const workflowsPath = join(SOURCE_DIR, 'workflows');
  const availableWorkflows = (await fs.readdir(workflowsPath))
    .filter(file => file.endsWith('.md'))
    .map(file => ({ value: file, label: file.replace('.md', '') }));

  const selectedWorkflows = await p.multiselect({
    message: 'Select workflows (Slash Commands) to enable:',
    options: availableWorkflows,
    required: false,
  });

  if (p.isCancel(selectedWorkflows)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  const forceOverwrite = await p.confirm({
    message: 'Overwrite existing configurations? (Backup will be created)',
    initialValue: true,
  });

  if (p.isCancel(forceOverwrite)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  const s = p.spinner();
  s.start('Configuring agents and linking resources...');

  try {
    // 1. Antigravity Symlink Compatibility (only if modular)
    if (installMode === 'modular' && !(await fs.pathExists(join(REPO_ROOT, '.agent')))) {
      await applyConfig('.agent', '.agents', 'modular', forceOverwrite);
    }

    // 2. Setup Selected Agents
    for (const agent of agents) {
      switch (agent) {
        case 'opencode':
          await setupOpenCode(selectedSkills, selectedPersonas, selectedWorkflows, installMode, forceOverwrite);
          break;
        case 'claude':
          await setupClaude(selectedSkills, installMode, forceOverwrite);
          break;
        case 'copilot':
          await setupCopilot(installMode, forceOverwrite);
          break;
        case 'cursor':
          await setupCursor(installMode, forceOverwrite);
          break;
        case 'antigravity':
          await setupAntigravity(selectedSkills, selectedPersonas, selectedWorkflows, installMode, forceOverwrite);
          break;
      }
    }
    s.stop(pc.green('Configuration complete!'));
  } catch (error) {
    s.stop(pc.red('Setup failed.'));
    console.error(error);
    process.exit(1);
  }

  p.outro(`✨ ${pc.bold('Ready to go!')} ${pc.dim('Restart your AI assistant to load the new context.')}`);
}

async function setupOpenCode(skills, personas, workflows, installMode, force) {
  const dir = '.opencode';
  await fs.ensureDir(join(REPO_ROOT, dir, 'skills'));
  await fs.ensureDir(join(REPO_ROOT, dir, 'agents'));
  await fs.ensureDir(join(REPO_ROOT, dir, 'commands'));
  await fs.ensureDir(join(REPO_ROOT, dir, 'rules'));

  // Rules (Always sync for precision)
  await applyConfig(join(dir, 'rules'), '.agents/rules', installMode, force);

  // Skills
  for (const skill of skills) {
    await applyConfig(join(dir, 'skills', skill), join('.agents/skills', skill), installMode, force);
  }

  // Selected Personas
  for (const persona of personas) {
    await applyConfig(join(dir, 'agents', persona), join('.agents/agents', persona), installMode, force);
  }

  // Selected Workflows
  for (const workflow of workflows) {
    await applyConfig(join(dir, 'commands', workflow), join('.agents/workflows', workflow), installMode, force);
  }

  // opencode.json
  const configPath = join(REPO_ROOT, 'opencode.json');
  if (!(await fs.pathExists(configPath)) || force) {
    const rulesPath = installMode === 'modular' ? '.agents/rules/*.md' : '.opencode/rules/*.md';
    const agentsMdPath = installMode === 'modular' ? 'AGENTS.md' : 'GEMINI.md';

    const config = {
      $schema: 'https://opencode.ai/config.json',
      instructions: [agentsMdPath, rulesPath],
      permission: {
        skill: { '*': 'allow' },
        bash: {
          '*': 'allow',
          'git commit *': 'ask',
          'git push *': 'ask'
        },
        read: { '*': 'allow', '*.env': 'deny' }
      }
    };
    await fs.writeJson(configPath, config, { spaces: 2 });
  }
}

async function setupClaude(skills, installMode, force) {
  const dir = '.claude/skills';
  
  // Link or copy selected skills to .claude/skills
  for (const skill of skills) {
    await applyConfig(join(dir, skill), join('.agents/skills', skill), installMode, force);
  }

  // Create CLAUDE.md (Source of Truth)
  await applyConfig('CLAUDE.md', 'AGENTS.md', installMode, force);

  // If standalone, we must fix the paths in CLAUDE.md because .agents/ doesn't exist
  if (installMode === 'standalone') {
    const claudeMdPath = join(REPO_ROOT, 'CLAUDE.md');
    let content = await fs.readFile(claudeMdPath, 'utf-8');
    content = content.replaceAll('.agents/skills/', '.claude/skills/');
    await fs.writeFile(claudeMdPath, content);
  }
}

async function setupCopilot(installMode, force) {
  await applyConfig('.github/copilot-instructions.md', 'AGENTS.md', installMode, force);
}

async function setupCursor(installMode, force) {
  await applyConfig('.cursorrules', 'AGENTS.md', installMode, force);
}

async function setupAntigravity(skills, personas, workflows, installMode, force) {
  const dir = '.agent';
  await fs.ensureDir(join(REPO_ROOT, dir));
  
  // Rules (Always sync)
  await applyConfig(join(dir, 'rules'), '.agents/rules', installMode, force);
  
  // Selected Skills
  for (const skill of skills) {
    await applyConfig(join(dir, 'skills', skill), join('.agents/skills', skill), installMode, force);
  }
  
  // Selected Personas
  for (const persona of personas) {
    await applyConfig(join(dir, 'agents', persona), join('.agents/agents', persona), installMode, force);
  }
  
  // Selected Workflows
  for (const workflow of workflows) {
    await applyConfig(join(dir, 'workflows', workflow), join('.agents/workflows', workflow), installMode, force);
  }

  await applyConfig('GEMINI.md', 'AGENTS.md', installMode, force);
}
