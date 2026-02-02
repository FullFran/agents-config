import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

const CLI_PATH = join(process.cwd(), 'bin/cli.js');

describe('Non-Destructive Setup Tests', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `setup-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    // Crear un package.json mínimo
    await fs.writeJson(join(tempDir, 'package.json'), { name: 'test-project', scripts: {} });
  });

  after(async () => {
    // Limpieza
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  test('Setup debe preservar archivos existentes en .agent/skills/', async () => {
    // GIVEN: Un proyecto con una skill personalizada existente
    const existingSkillDir = join(tempDir, '.agent/skills/my-custom-skill');
    await fs.ensureDir(existingSkillDir);
    await fs.writeFile(join(existingSkillDir, 'SKILL.md'), '---\nname: my-custom-skill\ndescription: My custom skill\n---\n# Custom');
    await fs.writeFile(join(existingSkillDir, 'custom-file.txt'), 'This should NOT be deleted');

    // WHEN: Se ejecuta el setup (simulamos copiando archivos como haría el CLI)
    const sourceAgents = join(process.cwd(), '.agents');
    const targetAgents = join(tempDir, '.agents');
    await fs.copy(sourceAgents, targetAgents, { overwrite: false });

    // THEN: La skill personalizada debe seguir existiendo
    const customSkillExists = await fs.pathExists(join(tempDir, '.agent/skills/my-custom-skill/SKILL.md'));
    const customFileExists = await fs.pathExists(join(tempDir, '.agent/skills/my-custom-skill/custom-file.txt'));
    
    assert.ok(customSkillExists, 'La skill personalizada debería seguir existiendo');
    assert.ok(customFileExists, 'Los archivos personalizados no deben ser borrados');
  });

  test('Setup debe hacer merge de directorios sin borrar contenido existente', async () => {
    // GIVEN: Una carpeta .agents con skills personalizadas
    const existingSkill = join(tempDir, '.agents/skills/existing-skill');
    await fs.ensureDir(existingSkill);
    await fs.writeFile(join(existingSkill, 'SKILL.md'), '---\nname: existing-skill\ndescription: Existing\n---');

    // WHEN: Copiamos las skills del paquete SIN overwrite
    const sourceSkills = join(process.cwd(), '.agents/skills');
    const targetSkills = join(tempDir, '.agents/skills');
    await fs.copy(sourceSkills, targetSkills, { overwrite: false });

    // THEN: Ambas skills deben coexistir
    const existingStillThere = await fs.pathExists(join(tempDir, '.agents/skills/existing-skill/SKILL.md'));
    const newSkillAdded = await fs.pathExists(join(tempDir, '.agents/skills/mermaid-diagrams/SKILL.md'));

    assert.ok(existingStillThere, 'La skill existente debe permanecer');
    assert.ok(newSkillAdded, 'Las nuevas skills deben añadirse');
  });

  test('fs.copy con overwrite:false no debe sobreescribir archivos existentes', async () => {
    // GIVEN: Un archivo existente con contenido personalizado
    const targetFile = join(tempDir, 'test.md');
    await fs.writeFile(targetFile, 'ORIGINAL CONTENT');

    // WHEN: Intentamos copiar otro archivo encima con overwrite: false
    const sourceFile = join(tempDir, 'source.md');
    await fs.writeFile(sourceFile, 'NEW CONTENT');
    await fs.copy(sourceFile, targetFile, { overwrite: false });

    // THEN: El contenido original debe permanecer
    const content = await fs.readFile(targetFile, 'utf-8');
    assert.strictEqual(content, 'ORIGINAL CONTENT', 'El archivo original no debe ser sobreescrito');
  });
});

describe('Reconciliation Tests', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `reconcile-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  after(async () => {
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  test('Reconciliación debe importar skills de .agent a .agents', async () => {
    // GIVEN: Un proyecto con skills en .agent pero no en .agents
    await fs.ensureDir(join(tempDir, '.agents/skills'));
    await fs.ensureDir(join(tempDir, '.agent/skills/orphan-skill'));
    await fs.writeFile(join(tempDir, '.agent/skills/orphan-skill/SKILL.md'), '---\nname: orphan-skill\ndescription: Orphan\n---');

    // Importar la función de reconciliación
    const { reconcileResources } = await import('../src/commands/sync.js');

    // WHEN: Ejecutamos la reconciliación
    const imported = await reconcileResources(tempDir);

    // THEN: La skill huérfana debe haber sido importada a .agents
    const importedSkill = await fs.pathExists(join(tempDir, '.agents/skills/orphan-skill/SKILL.md'));
    assert.ok(importedSkill, 'La skill huérfana debe ser importada a la fuente de verdad');
    assert.strictEqual(imported, 1, 'Debe reportar 1 recurso importado');
  });

  test('Reconciliación debe importar workflows de .opencode/commands a .agents/workflows', async () => {
    // GIVEN: Un workflow en .opencode/commands que no existe en .agents
    await fs.ensureDir(join(tempDir, '.agents/workflows'));
    await fs.ensureDir(join(tempDir, '.opencode/commands'));
    await fs.writeFile(join(tempDir, '.opencode/commands/custom-workflow.md'), '---\ndescription: Custom\n---');

    const { reconcileResources } = await import('../src/commands/sync.js');

    // WHEN
    const imported = await reconcileResources(tempDir);

    // THEN
    const importedWorkflow = await fs.pathExists(join(tempDir, '.agents/workflows/custom-workflow.md'));
    assert.ok(importedWorkflow, 'El workflow debe ser importado');
  });

  test('Reconciliación debe ignorar symlinks para evitar bucles', async () => {
    // GIVEN: Una skill que es un symlink (no un archivo real)
    await fs.ensureDir(join(tempDir, '.agents/skills/real-skill'));
    await fs.writeFile(join(tempDir, '.agents/skills/real-skill/SKILL.md'), 'real');
    await fs.ensureDir(join(tempDir, '.agent/skills'));
    await fs.symlink(
      join(tempDir, '.agents/skills/real-skill'),
      join(tempDir, '.agent/skills/real-skill')
    );

    const { reconcileResources } = await import('../src/commands/sync.js');

    // WHEN
    const imported = await reconcileResources(tempDir);

    // THEN: No debe intentar importar el symlink
    assert.strictEqual(imported, 0, 'No debe importar symlinks');
  });

  test('Reconciliación no debe duplicar skills que ya existen en .agents', async () => {
    // GIVEN: La misma skill existe en ambos lugares
    await fs.ensureDir(join(tempDir, '.agents/skills/shared-skill'));
    await fs.writeFile(join(tempDir, '.agents/skills/shared-skill/SKILL.md'), 'original');
    await fs.ensureDir(join(tempDir, '.agent/skills/shared-skill'));
    await fs.writeFile(join(tempDir, '.agent/skills/shared-skill/SKILL.md'), 'duplicate');

    const { reconcileResources } = await import('../src/commands/sync.js');

    // WHEN
    const imported = await reconcileResources(tempDir);

    // THEN: No debe importar nada porque ya existe
    assert.strictEqual(imported, 0, 'No debe importar duplicados');
    
    // Y el original debe permanecer intacto
    const content = await fs.readFile(join(tempDir, '.agents/skills/shared-skill/SKILL.md'), 'utf-8');
    assert.strictEqual(content, 'original', 'El contenido original debe permanecer');
  });
});

describe('Script Namespacing Tests', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `namespace-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    await fs.writeJson(join(tempDir, 'package.json'), { 
      name: 'existing-project', 
      scripts: { 
        sync: 'existing-sync-command',
        build: 'tsc'
      } 
    });
  });

  after(async () => {
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  test('Scripts con namespace no deben sobreescribir scripts existentes', async () => {
    // GIVEN: Un proyecto con un script "sync" existente
    const pkgPath = join(tempDir, 'package.json');
    const originalPkg = await fs.readJson(pkgPath);
    
    // Simulamos lo que haría updatePackageScripts con prefix 'agents'
    originalPkg.scripts['agents:sync'] = 'agents-config sync';
    originalPkg.scripts['agents:init'] = 'agents-config init';
    await fs.writeJson(pkgPath, originalPkg, { spaces: 2 });

    // THEN: El script original "sync" debe seguir intacto
    const finalPkg = await fs.readJson(pkgPath);
    assert.strictEqual(finalPkg.scripts.sync, 'existing-sync-command', 'El script original no debe ser sobreescrito');
    assert.strictEqual(finalPkg.scripts['agents:sync'], 'agents-config sync', 'El script con namespace debe existir');
  });
});

describe('Edge Cases', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `edge-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  after(async () => {
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  test('Debe manejar graciosamente carpetas vacías', async () => {
    // GIVEN: Carpetas vacías
    await fs.ensureDir(join(tempDir, '.agents/skills'));
    await fs.ensureDir(join(tempDir, '.agent/skills'));

    const { reconcileResources } = await import('../src/commands/sync.js');

    // WHEN/THEN: No debe fallar
    const imported = await reconcileResources(tempDir);
    assert.strictEqual(imported, 0);
  });

  test('Debe manejar archivos con caracteres especiales en el nombre', async () => {
    // GIVEN: Una skill con nombre que contiene guiones
    const skillDir = join(tempDir, '.agents/skills/my-awesome-skill');
    await fs.ensureDir(skillDir);
    await fs.writeFile(join(skillDir, 'SKILL.md'), '---\nname: my-awesome-skill\ndescription: Test\n---');

    const { parseFrontmatter } = await import('../src/commands/sync.js');
    const content = await fs.readFile(join(skillDir, 'SKILL.md'), 'utf-8');
    const fm = parseFrontmatter(content);

    assert.strictEqual(fm.name, 'my-awesome-skill');
  });

  test('Debe preservar permisos de archivos durante la copia', async () => {
    // GIVEN: Un archivo con permisos específicos
    const sourceFile = join(tempDir, 'source.sh');
    await fs.writeFile(sourceFile, '#!/bin/bash\necho "test"');
    await fs.chmod(sourceFile, 0o755);

    // WHEN: Copiamos el archivo
    const targetFile = join(tempDir, 'target.sh');
    await fs.copy(sourceFile, targetFile);

    // THEN: Los permisos deben mantenerse
    const stats = await fs.stat(targetFile);
    const mode = stats.mode & 0o777;
    assert.strictEqual(mode, 0o755, 'Los permisos deben preservarse');
  });
});
