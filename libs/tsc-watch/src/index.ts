#!/usr/bin/env node

import minimist = require('minimist');
import TscWatchClient = require('tsc-watch/client');
import { mkdirSync } from 'fs';

import { initStatusFile, changeStatus, STATUS } from './status';
import { join, dirname } from 'path';

const watch = new TscWatchClient();

const args = minimist(process.argv.slice(2));

if (args.help || args.h) {
  console.log(`
    USAGE: sf-tsc-watch [options]
    
    sf-tsc-watch  --project /home/user/helloworld
    
    --project   : Project path, must be absolute path (optional)
    --status    : File path that wiil be written result of compiling, must be absolute path (optional)

		DEFAULTS
		project     : $(cwd)
		status      : $(project)/.theia/compiler_status.json
    `);
  process.exit(1);
}
args.project = args.project || process.cwd();
const statusFile = args.status || join(args.project, '.theia/compiler_status.json');

try {
  mkdirSync(dirname(statusFile), { recursive: true });
  initStatusFile(statusFile);
} catch (e) {
  console.error(e);
  process.exit(1);
}

watch.on('started', () => {
  changeStatus(STATUS.compiling);
});

watch.on('first_success', () => {
  changeStatus(STATUS.compiled);
});

watch.on('success', () => {
  // Your code goes here...
  changeStatus(STATUS.compiled);
});

watch.on('compile_errors', () => {
  // Your code goes here...
  changeStatus(STATUS.error);
});

watch.start('--project', args.project);
