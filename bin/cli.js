#!/usr/bin/env node
import { setup } from '../src/commands/setup.js';
import { sync } from '../src/commands/sync.js';
import { addSkill } from '../src/commands/add-skill.js';
import { addWorkflow } from '../src/commands/add-workflow.js';
import { Command } from 'commander';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = fs.readJsonSync(join(__dirname, '../package.json'));

const program = new Command();

program
  .name('agents-config')
  .description('AI-assisted programming framework setup')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize agent configurations interactively')
  .action(async () => {
    await setup();
  });

program
  .command('sync')
  .description('Sync all metadata (skills, workflows, personas, rules) to AGENTS.md')
  .action(async () => {
    await sync();
  });

program
  .command('add-skill')
  .alias('skill')
  .description('Create a new skill interactively')
  .action(async () => {
    await addSkill();
  });

program
  .command('add-workflow')
  .alias('workflow')
  .description('Create a new workflow (slash command) interactively')
  .action(async () => {
    await addWorkflow();
  });

// Default to init if no command provided
if (!process.argv.slice(2).length) {
  setup();
} else {
  program.parse(process.argv);
}
