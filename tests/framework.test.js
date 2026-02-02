import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import { join } from 'path';
import { tmpdir } from 'os';
import { detectExistingAgents } from '../src/utils/detection.js';

describe('AI Framework Integration Tests', () => {
  let tempDir;

  before(async () => {
    tempDir = join(tmpdir(), `agents-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  after(async () => {
    await fs.remove(tempDir);
  });

  test('Debe detectar agentes existentes correctamente', async () => {
    // Simular un proyecto con OpenCode y Antigravity
    await fs.ensureDir(join(tempDir, '.opencode'));
    await fs.ensureDir(join(tempDir, '.agent'));
    await fs.writeFile(join(tempDir, 'GEMINI.md'), '# Gemini Config');

    const detected = await detectExistingAgents(tempDir);
    
    assert.ok(detected.includes('opencode'), 'Debería detectar opencode');
    assert.ok(detected.includes('antigravity'), 'Debería detectar antigravity');
    assert.strictEqual(detected.length, 2);
  });

  test('No debe detectar agentes si las carpetas no existen', async () => {
    const emptyDir = join(tempDir, 'empty');
    await fs.ensureDir(emptyDir);
    const detected = await detectExistingAgents(emptyDir);
    assert.strictEqual(detected.length, 0);
  });

  test('Validación de estructura de Skills', async () => {
    const skillsDir = join(tempDir, '.agents/skills/test-skill');
    await fs.ensureDir(skillsDir);
    await fs.writeFile(join(skillsDir, 'SKILL.md'), '---\nname: test-skill\ndescription: test\n---\n# Test');

    const exists = await fs.pathExists(join(skillsDir, 'SKILL.md'));
    assert.ok(exists, 'El archivo SKILL.md debería existir');
    
    const content = await fs.readFile(join(skillsDir, 'SKILL.md'), 'utf-8');
    assert.ok(content.includes('name: test-skill'), 'El frontmatter debería ser correcto');
  });
});
