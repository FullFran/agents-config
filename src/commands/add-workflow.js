import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import { join } from 'path';
import { sync } from './sync.js';

const REPO_ROOT = process.cwd();
const WORKFLOWS_DIR = join(REPO_ROOT, '.agents', 'workflows');

function validateWorkflowName(name) {
  if (!name) return 'Name is required';
  if (!/^[a-z][a-z0-9-]*$/.test(name)) return 'Lowercase and hyphens only';
  return undefined;
}

function generateWorkflowContent(name, description, steps) {
  const title = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  let stepsMarkdown = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return `---
description: ${description}
---

# Workflow: ${title}

${description}

## Steps

${stepsMarkdown}

// turbo
`;
}

export async function addWorkflow() {
  p.intro(`${pc.magenta(pc.bold('⚡ ADD NEW WORKFLOW'))}`);

  if (!(await fs.pathExists(WORKFLOWS_DIR))) {
    p.log.error(`${pc.red('Error:')} .agents/workflows/ directory not found.`);
    process.exit(1);
  }

  const name = await p.text({
    message: 'Workflow name (slash command):',
    validate: validateWorkflowName
  });
  if (p.isCancel(name)) process.exit(0);

  const workflowPath = join(WORKFLOWS_DIR, `${name}.md`);
  if (await fs.pathExists(workflowPath)) {
    p.log.error(`${pc.red('Error:')} Workflow already exists.`);
    process.exit(1);
  }

  const description = await p.text({
    message: 'Description:',
    validate: (val) => !val ? 'Required' : undefined
  });
  if (p.isCancel(description)) process.exit(0);

  p.log.info(pc.dim('Enter steps (empty line to finish):'));
  const steps = [];
  let adding = true;
  while (adding) {
    const step = await p.text({ message: `Step ${steps.length + 1}:` });
    if (p.isCancel(step)) process.exit(0);
    if (!step) {
      if (steps.length === 0) continue;
      adding = false;
    } else {
      steps.push(step);
    }
  }

  const s = p.spinner();
  s.start('Creating workflow...');
  try {
    await fs.writeFile(workflowPath, generateWorkflowContent(name, description, steps));
    s.stop(pc.green('Workflow created!'));
    await sync();
  } catch (error) {
    s.stop(pc.red('Failed to create workflow.'));
    console.error(error);
  }
  p.outro(pc.bold(`✅ Workflow "/${name}" ready!`));
}
