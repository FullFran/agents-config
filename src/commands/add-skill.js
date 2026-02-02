import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import { join } from 'path';
import { sync } from './sync.js';

const REPO_ROOT = process.cwd();
const SKILLS_DIR = join(REPO_ROOT, '.agents', 'skills');

/**
 * Validate skill name according to agentskills.io standard
 */
function validateSkillName(name) {
  if (!name || name.length === 0) return 'Name is required';
  if (name.length > 64) return 'Name must be 64 characters or less';
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return 'Name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens';
  }
  return undefined;
}

/**
 * Generate SKILL.md content from template
 */
function generateSkillContent(name, description, author) {
  return `---
name: ${name}
description: ${description}
license: MIT
metadata:
  author: ${author}
  version: "1.0"
---

# ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

${description}

## When to Use
Use this skill when:
- TODO: Add trigger conditions

## Process
1. **Step 1**: TODO
2. **Step 2**: TODO

## Examples
\`\`\`
TODO: Add usage examples
\`\`\`
`;
}

export async function addSkill() {
  p.intro(`${pc.magenta(pc.bold('✨ ADD NEW SKILL'))}`);

  if (!(await fs.pathExists(SKILLS_DIR))) {
    p.log.error(`${pc.red('Error:')} .agents/skills/ directory not found.`);
    process.exit(1);
  }

  const name = await p.text({
    message: 'Skill name (lowercase, hyphens allowed):',
    placeholder: 'my-new-skill',
    validate: validateSkillName
  });
  if (p.isCancel(name)) process.exit(0);

  const skillDir = join(SKILLS_DIR, name);
  if (await fs.pathExists(skillDir)) {
    p.log.error(`${pc.red('Error:')} Skill "${name}" already exists.`);
    process.exit(1);
  }

  const description = await p.text({
    message: 'Brief description:',
    validate: (val) => !val ? 'Description is required' : undefined
  });
  if (p.isCancel(description)) process.exit(0);

  const author = await p.text({
    message: 'Author name:',
    initialValue: 'anonymous'
  });
  if (p.isCancel(author)) process.exit(0);

  const extras = await p.multiselect({
    message: 'Include optional directories?',
    options: [
      { value: 'scripts', label: 'scripts/' },
      { value: 'references', label: 'references/' },
      { value: 'assets', label: 'assets/' }
    ],
    required: false
  });
  if (p.isCancel(extras)) process.exit(0);

  const s = p.spinner();
  s.start('Creating skill...');

  try {
    await fs.ensureDir(skillDir);
    await fs.writeFile(join(skillDir, 'SKILL.md'), generateSkillContent(name, description, author));
    for (const extra of extras) {
      await fs.ensureDir(join(skillDir, extra));
      await fs.writeFile(join(skillDir, extra, '.gitkeep'), '');
    }
    s.stop(pc.green('Skill created!'));
    
    // Auto-sync
    await sync();
  } catch (error) {
    s.stop(pc.red('Failed to create skill.'));
    console.error(error);
    process.exit(1);
  }

  p.outro(pc.bold(`✅ Skill "${name}" ready!`));
}
