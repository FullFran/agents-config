import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '../..');

let SOURCE_DIR = join(REPO_ROOT, '.agents');

/**
 * Detecta qué agentes están ya configurados en el repo
 */
async function detectExistingAgents() {
  const detected = [];
  if (await fs.pathExists(join(REPO_ROOT, '.opencode'))) detected.push('opencode');
  if (await fs.pathExists(join(REPO_ROOT, 'CLAUDE.md'))) detected.push('claude');
  if (await fs.pathExists(join(REPO_ROOT, '.github/copilot-instructions.md'))) detected.push('copilot');
  if (await fs.pathExists(join(REPO_ROOT, '.cursorrules'))) detected.push('cursor');
  if (await fs.pathExists(join(REPO_ROOT, '.agent')) || await fs.pathExists(join(REPO_ROOT, 'GEMINI.md'))) detected.push('antigravity');
  return detected;
}

async function ensureSource(installMode) {
  if (installMode === 'modular') {
    const packageSource = join(PACKAGE_ROOT, '.agents');
    if (!(await fs.pathExists(packageSource))) {
      throw new Error(`Package source directory not found: ${packageSource}`);
    }
    await fs.ensureDir(SOURCE_DIR);
    const criticalDirs = ['skills', 'rules', 'agents', 'workflows'];
    for (const dir of criticalDirs) {
      const dirPath = join(SOURCE_DIR, dir);
      if (!(await fs.pathExists(dirPath))) {
        await fs.copy(join(packageSource, dir), dirPath);
      }
    }
    const agentsMdTarget = join(REPO_ROOT, 'AGENTS.md');
    if (!(await fs.pathExists(agentsMdTarget))) {
      await fs.copy(join(PACKAGE_ROOT, 'AGENTS.md'), agentsMdTarget);
    }
  } else {
    SOURCE_DIR = join(PACKAGE_ROOT, '.agents');
  }
}

async function applyConfig(target, sourceRel, installMode, forceAll = false) {
  const targetAbs = join(REPO_ROOT, target);
  const cleanSourceRel = sourceRel.startsWith('.agents/') ? sourceRel.substring(8) : sourceRel === '.agents' ? '' : sourceRel;
  const sourceAbs = join(installMode === 'modular' ? join(REPO_ROOT, '.agents') : join(PACKAGE_ROOT, '.agents'), cleanSourceRel);
  const finalSourceAbs = sourceRel === 'AGENTS.md' ? (installMode === 'modular' ? join(REPO_ROOT, 'AGENTS.md') : join(PACKAGE_ROOT, 'AGENTS.md')) : sourceAbs;

  let sourceStat = await fs.stat(finalSourceAbs);
  await fs.ensureDir(dirname(targetAbs));
  
  const exists = await fs.pathExists(targetAbs);
  if (exists && !forceAll) {
    const lstat = await fs.lstat(targetAbs);
    if (!lstat.isSymbolicLink()) {
      const backupPath = `${targetAbs}.backup-${Date.now()}`;
      await fs.move(targetAbs, backupPath);
    }
  }
  await fs.remove(targetAbs); 
  if (installMode === 'modular') {
    const relTarget = relative(dirname(targetAbs), finalSourceAbs);
    await fs.symlink(relTarget, targetAbs, sourceStat.isDirectory() ? 'dir' : 'file');
  } else {
    await fs.copy(finalSourceAbs, targetAbs);
  }
}

export async function setup() {
  p.intro(`${pc.magenta(pc.bold('🤖 AGENTS CONFIG SETUP'))} ${pc.dim('by FullFran')}`);

  const installMode = await p.select({
    message: 'Installation mode:',
    options: [
      { value: 'modular', label: 'Modular (Recommended)', hint: 'Symlinks to .agents/. Best for syncing.' },
      { value: 'standalone', label: 'Standalone', hint: 'Copies files. No .agents/ folder in repo.' },
    ],
  });

  if (p.isCancel(installMode)) process.exit(0);

  await ensureSource(installMode);

  // 1. AUTO-DETECCIÓN DE AGENTES
  const existingAgents = await detectExistingAgents();
  const agents = await p.multiselect({
    message: 'Select agents to configure:',
    initialValues: existingAgents,
    options: [
      { value: 'opencode', label: 'OpenCode TUI' },
      { value: 'claude', label: 'Claude Code' },
      { value: 'copilot', label: 'GitHub Copilot' },
      { value: 'cursor', label: 'Cursor IDE' },
      { value: 'antigravity', label: 'Antigravity IDE' },
    ],
  });

  if (p.isCancel(agents)) process.exit(0);

  // 2. SKILLS CON DESCRIPCIÓN Y OPCIÓN "ALL"
  const skillsPath = join(SOURCE_DIR, 'skills');
  const skillDirs = (await fs.readdir(skillsPath, { withFileTypes: true })).filter(d => d.isDirectory());
  
  const availableSkills = [];
  for (const d of skillDirs) {
    const mdPath = join(skillsPath, d.name, 'SKILL.md');
    let description = 'No description';
    if (await fs.pathExists(mdPath)) {
      const content = await fs.readFile(mdPath, 'utf-8');
      const match = content.match(/description:\s*(.*)/);
      if (match) description = match[1].trim().replace(/^["']|["']$/g, '');
    }
    availableSkills.push({ value: d.name, label: d.name, hint: description });
  }

  let selectedSkills = await p.multiselect({
    message: 'Select skills to enable:',
    options: [{ value: 'all', label: pc.yellow('⭐ ALL SKILLS'), hint: 'Enable everything available' }, ...availableSkills],
    required: false,
  });
  if (p.isCancel(selectedSkills)) process.exit(0);
  if (selectedSkills.includes('all')) selectedSkills = availableSkills.map(s => s.value);

  // 3. PERSONAS CON OPCIÓN "ALL"
  const availablePersonas = (await fs.readdir(join(SOURCE_DIR, 'agents')))
    .filter(f => f.endsWith('.md'))
    .map(f => ({ value: f, label: f.replace('.md', '') }));

  let selectedPersonas = await p.multiselect({
    message: 'Select personas:',
    options: [{ value: 'all', label: pc.yellow('⭐ ALL PERSONAS') }, ...availablePersonas],
    required: false,
  });
  if (p.isCancel(selectedPersonas)) process.exit(0);
  if (selectedPersonas.includes('all')) selectedPersonas = availablePersonas.map(p => p.value);

  // 4. WORKFLOWS CON OPCIÓN "ALL"
  const availableWorkflows = (await fs.readdir(join(SOURCE_DIR, 'workflows')))
    .filter(f => f.endsWith('.md'))
    .map(f => ({ value: f, label: f.replace('.md', '') }));

  let selectedWorkflows = await p.multiselect({
    message: 'Select workflows:',
    options: [{ value: 'all', label: pc.yellow('⭐ ALL WORKFLOWS') }, ...availableWorkflows],
    required: false,
  });
  if (p.isCancel(selectedWorkflows)) process.exit(0);
  if (selectedWorkflows.includes('all')) selectedWorkflows = availableWorkflows.map(w => w.value);

  const s = p.spinner();
  s.start('Configuring agents...');

  try {
    if (installMode === 'modular' && !(await fs.pathExists(join(REPO_ROOT, '.agent')))) {
      await applyConfig('.agent', '.agents', 'modular', true);
    }

    for (const agent of agents) {
      if (agent === 'opencode') await setupOpenCode(selectedSkills, selectedPersonas, selectedWorkflows, installMode);
      if (agent === 'claude') await setupClaude(selectedSkills, installMode);
      if (agent === 'copilot') await setupCopilot(installMode);
      if (agent === 'cursor') await setupCursor(installMode);
      if (agent === 'antigravity') await setupAntigravity(selectedSkills, selectedPersonas, selectedWorkflows, installMode);
    }
    s.stop(pc.green('Configuration complete!'));
  } catch (error) {
    s.stop(pc.red('Setup failed.'));
    console.error(error);
  }

  p.outro(`✨ ${pc.bold('Ready!')} Run ${pc.cyan('npm run sync')} to finalize.`);
}

async function setupOpenCode(skills, personas, workflows, installMode) {
  const dir = '.opencode';
  await fs.ensureDir(join(REPO_ROOT, dir));
  await applyConfig(join(dir, 'rules'), '.agents/rules', installMode, true);
  for (const s of skills) await applyConfig(join(dir, 'skills', s), join('.agents/skills', s), installMode, true);
  for (const p of personas) await applyConfig(join(dir, 'agents', p), join('.agents/agents', p), installMode, true);
  for (const w of workflows) await applyConfig(join(dir, 'commands', w), join('.agents/workflows', w), installMode, true);

  const configPath = join(REPO_ROOT, 'opencode.json');
  const config = {
    $schema: 'https://opencode.ai/config.json',
    instructions: [installMode === 'modular' ? 'AGENTS.md' : 'GEMINI.md', installMode === 'modular' ? '.agents/rules/*.md' : '.opencode/rules/*.md'],
    permission: { skill: { '*': 'allow' }, bash: { '*': 'allow', 'git commit *': 'ask', 'git push *': 'ask' }, read: { '*': 'allow', '*.env': 'deny' } }
  };
  await fs.writeJson(configPath, config, { spaces: 2 });
}

async function setupClaude(skills, installMode) {
  for (const s of skills) await applyConfig(join('.claude/skills', s), join('.agents/skills', s), installMode, true);
  await applyConfig('CLAUDE.md', 'AGENTS.md', installMode, true);
}

async function setupCopilot(installMode) {
  await applyConfig('.github/copilot-instructions.md', 'AGENTS.md', installMode, true);
}

async function setupCursor(installMode) {
  await applyConfig('.cursorrules', 'AGENTS.md', installMode, true);
}

async function setupAntigravity(skills, personas, workflows, installMode) {
  const dir = '.agent';
  await fs.ensureDir(join(REPO_ROOT, dir));
  await applyConfig(join(dir, 'rules'), '.agents/rules', installMode, true);
  for (const s of skills) await applyConfig(join(dir, 'skills', s), join('.agents/skills', s), installMode, true);
  for (const p of personas) await applyConfig(join(dir, 'agents', p), join('.agents/agents', p), installMode, true);
  for (const w of workflows) await applyConfig(join(dir, 'workflows', w), join('.agents/workflows', w), installMode, true);
  await applyConfig('GEMINI.md', 'AGENTS.md', installMode, true);
}
