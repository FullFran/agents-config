import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const AGENTS_DIR = join(REPO_ROOT, '.agents');
const SKILLS_DIR = join(AGENTS_DIR, 'skills');
const AGENTS_MD = join(REPO_ROOT, 'AGENTS.md');

export async function sync() {
  p.intro(`${pc.magenta(pc.bold('🔄 AGENTS SKILLS SYNC'))}`);

  const s = p.spinner();
  s.start('Validating and indexing skills...');

  try {
    const skills = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
    const validSkills = [];

    for (const dirent of skills) {
      if (dirent.isDirectory()) {
        const skillMdPath = join(SKILLS_DIR, dirent.name, 'SKILL.md');
        if (await fs.pathExists(skillMdPath)) {
          const content = await fs.readFile(skillMdPath, 'utf-8');
          const nameMatch = content.match(/^name:\s*(.+)$/m);
          const descMatch = content.match(/^description:\s*(.+)$/m);
          
          const name = nameMatch ? nameMatch[1].trim() : null;
          const description = descMatch ? descMatch[1].trim() : 'No description';

          if (name === dirent.name) {
            validSkills.push({
              name,
              description,
              path: `.agents/skills/${name}/SKILL.md`
            });
          }
        }
      }
    }

    // Generate Markdown Table
    let table = '| Skill | Description | URL |\n|-------|-------------|-----|\n';
    for (const skill of validSkills) {
      table += `| \`${skill.name}\` | ${skill.description} | [${skill.path}](${skill.path}) |\n`;
    }

    // Update AGENTS.md
    let agentsContent = await fs.readFile(AGENTS_MD, 'utf-8');
    const skillsHeader = '## Available Skills';
    const nextHeaderMatch = agentsContent.slice(agentsContent.indexOf(skillsHeader)).match(/\n##\s/);
    
    const startIndex = agentsContent.indexOf(skillsHeader);
    if (startIndex !== -1) {
      const before = agentsContent.substring(0, startIndex + skillsHeader.length);
      const after = nextHeaderMatch 
        ? agentsContent.substring(startIndex + skillsHeader.length + nextHeaderMatch.index)
        : '';
      
      const newContent = `${before}\n\n${table}\n${after.trim() ? after : ''}`;
      await fs.writeFile(AGENTS_MD, newContent.trim() + '\n');
    }

    s.stop(pc.green('Sync complete! AGENTS.md updated.'));
  } catch (error) {
    s.stop(pc.red('Sync failed.'));
    console.error(error);
    process.exit(1);
  }

  p.outro(pc.bold('✅ All skills synchronized.'));
}
