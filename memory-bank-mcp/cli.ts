#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);

// Create the program
const program = new Command();

// Set up version and description
program
  .name('mcp-memory-bank')
  .description('MCP Memory Bank server for Cursor IDE')
  .version('1.0.0');

// Add options
program
  .option('-p, --path <path>', 'Set custom path for memory bank storage', process.env.MEMORY_BASE_PATH)
  .option('-d, --debug', 'Enable debug mode', false);

// Parse arguments
program.parse(process.argv);
const options = program.opts();

// Set up environment variables based on options
if (options.path) {
  process.env.MEMORY_BASE_PATH = options.path;
}

if (options.debug) {
  console.log(chalk.blue('Debug mode enabled'));
  console.log(chalk.gray('Options:'), options);
}

// Welcome message
console.log(chalk.green('Starting MCP Memory Bank Server...'));
console.log(chalk.gray('Press Ctrl+C to stop the server'));

// Import and start the server
import('./memory-bank.js').then(() => {
  console.log(chalk.green('Server started successfully!'));
}).catch((error) => {
  console.error(chalk.red('Failed to start server:'), error);
  process.exit(1);
}); 