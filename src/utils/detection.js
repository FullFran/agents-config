import fs from 'fs-extra';
import { join } from 'path';

export async function detectExistingAgents(root) {
  const detected = [];
  if (await fs.pathExists(join(root, '.opencode'))) detected.push('opencode');
  if (await fs.pathExists(join(root, 'CLAUDE.md'))) detected.push('claude');
  if (await fs.pathExists(join(root, '.github/copilot-instructions.md'))) detected.push('copilot');
  if (await fs.pathExists(join(root, '.cursorrules'))) detected.push('cursor');
  if (await fs.pathExists(join(root, '.agent')) || await fs.pathExists(join(root, 'GEMINI.md'))) detected.push('antigravity');
  return detected;
}
