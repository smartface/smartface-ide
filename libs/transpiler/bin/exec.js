#!/usr/bin/env node

var args = require('minimist')(process.argv.slice(2));
const index = require("../index");

index(args);