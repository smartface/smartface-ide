import assert = require("assert");
import minimist = require("minimist");
import path = require('path');

import { convertCLIArgsToOpts } from "./util/convertCLIargs";

export type ConfigurationPaths = minimist.ParsedArgs | {
  rootPath?: string;
}

export class ConfigurationService {
  static instance: ConfigurationService;
  static baseImageServePath = "/ui-editor/img";
  
  constructor(private args: ConfigurationPaths) {
    ConfigurationService.instance = this;
  }

  getWorkspacePath(): string {
    assert(this.args.rootPath !== undefined, "Root path is empty");
    return this.args.rootPath;
  }

  getTempPath(): string {
    return path.join(this.getWorkspacePath(),'.tmp');
  }

  join(){
  }

  getCliArguments(){
    return convertCLIArgsToOpts(this.args);
  }
}
