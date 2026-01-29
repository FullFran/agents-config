#!/usr/bin/env node
import { setup } from '../src/commands/setup.js';
import { sync } from '../src/commands/sync.js';
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
  .description('Sync skills metadata to AGENTS.md')
  .action(async () => {
    await sync();
  });

// Default to init if no command provided
if (!process.argv.slice(2).length) {
  setup();
} else {
  program.parse(process.argv);
}

