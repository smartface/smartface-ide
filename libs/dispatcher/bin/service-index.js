#!/usr/bin/env node

process.argv.push("--restart");
process.argv.push("--verbose");

require("./index");
