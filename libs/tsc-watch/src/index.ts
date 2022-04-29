#!/usr/bin/env node

import { fork } from 'child_process';
import minimist = require('minimist');
import { manipulateColors } from './stdout-manipulator';


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

const argv = process.argv.slice();
argv.shift();
const watch = fork( require.resolve('./tsc-client.js'), argv, {stdio: 'pipe'});

watch.stdout.on('data', buff => {
  process.stdout.write(manipulateColors(buff.toString()));
});

watch.stderr.on('data', buff => {
  process.stderr.write(manipulateColors(buff.toString()));
});

process.on('exit', code => {
  watch.kill();
});

watch.on('exit', code => {
  console.log('Tsc child exit: ', code);
});

