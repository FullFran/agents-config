import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import { join } from 'path';
import { tmpdir } from 'os';
import { parseFrontmatter, reconcileResources, generateTable } from '../src/commands/sync.js';

describe('Team Sync Deep Validation', () => {
  let tempDir;

  before(async () => {
    tempDir = join(tmpdir(), `team-sync-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  after(async () => {
    await fs.remove(tempDir);
  });

  test('Parser: Debe manejar frontmatter con comillas y espacios', () => {
    const content = '---\nname: "skill-test"\ndescription:   Espacios extra   \n---';
    const fm = parseFrontmatter(content);
    assert.strictEqual(fm.name, 'skill-test');
    assert.strictEqual(fm.description, 'Espacios extra');
  });

  test('Reconcile: Debe importar una skill creada en .opencode a .agents', async () => {
    const root = join(tempDir, 'reconcile-test');
    await fs.ensureDir(join(root, '.agents/skills'));
    await fs.ensureDir(join(root, '.opencode/skills/new-skill'));
    await fs.writeFile(join(root, '.opencode/skills/new-skill/SKILL.md'), 'test');

    const imported = await reconcileResources(root);
    
    assert.strictEqual(imported, 1, 'Debería haber importado 1 skill');
    assert.ok(await fs.pathExists(join(root, '.agents/skills/new-skill/SKILL.md')), 'La skill debería existir en la carpeta central');
  });

  test('Reconcile: No debe duplicar si ya existe en .agents', async () => {
    const root = join(tempDir, 'duplicate-test');
    await fs.ensureDir(join(root, '.agents/skills/existing'));
    await fs.ensureDir(join(root, '.opencode/skills/existing'));
    
    const imported = await reconcileResources(root);
    assert.strictEqual(imported, 0, 'No debería importar nada si ya existe');
  });

  test('Table Gen: Debe generar markdown válido para tablas', () => {
    const items = [{ name: 'test', description: 'desc', path: 'path/to/skill' }];
    const cols = [{ header: 'Name', key: 'name' }, { header: 'Desc', key: 'description' }];
    const table = generateTable(items, cols);
    
    assert.ok(table.includes('| Name | Desc |'), 'Debe incluir cabecera');
    assert.ok(table.includes('| `test` | desc |'), 'Debe incluir la fila de datos');
  });
});
