#!/usr/bin/env node
var args = require('minimist')(process.argv.slice(2));

const root =
  args.rootPath ||
  process.env.ROOT_PATH ||
  process.env.SMF_CIDE_WS_PATH ||
  '/home/ubuntu/workspace';

process.argv.push('--restart');
// process.argv.push('--TRANSPILER_PORT=5000');
process.argv.push(`--configFile=${root}/${'app/settings.json'}`);
process.argv.push(`--workspacePath=${root}`);
// process.argv.push('--standalone');

require('./exec');
