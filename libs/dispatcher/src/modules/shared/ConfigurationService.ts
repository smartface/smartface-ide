import assert = require('assert');
import minimist = require('minimist');
import path = require('path');
import fs = require('fs');

import { convertCLIArgsToOpts } from './util/convertCLIargs';
import LogToConsole from './LogToConsole';

export type ConfigurationPaths = minimist.ParsedArgs & {
  rootPath?: string;
};

export type ProjectPathsType = {
  iOS: any;
  Android: any;
};

export class ConfigurationService {
  static instance: ConfigurationService;
  static baseImageServePath = '/ui-editor/img';
  private projectPaths: ProjectPathsType = { iOS: {}, Android: {} };

  constructor(private args: ConfigurationPaths) {
    ConfigurationService.instance = this;
    this.initProjectPaths();
  }

  getWorkspacePath(): string {
    assert(this.args.rootPath !== undefined, 'Root path is empty');
    return this.args.rootPath;
  }

  getTempPath(): string {
    return path.join(this.getWorkspacePath(), '.theia');
  }

  join() {}

  getCliArguments() {
    return convertCLIArgsToOpts(this.args);
  }

  private initProjectPaths() {
    const workspaceDir = this.getWorkspacePath();
    const content = fs.readFileSync(path.join(workspaceDir, 'config', 'project.json'), 'utf8');
    try {
      const project = JSON.parse(content);
      this.projectPaths.iOS.scripts = path.join(workspaceDir, project.build.input.ios.scripts);
      this.projectPaths.iOS.images = path.join(workspaceDir, project.build.input.ios.images);
      this.projectPaths.iOS.assets = path.join(workspaceDir, project.build.input.ios.assets);
      this.projectPaths.iOS.fonts = path.join(workspaceDir, 'config', 'Fonts');
      this.projectPaths.iOS.config = path.join(workspaceDir, 'config');
      this.projectPaths.Android.scripts = path.join(
        workspaceDir,
        project.build.input.android.scripts
      );
      this.projectPaths.Android.images = path.join(
        workspaceDir,
        project.build.input.android.images
      );
      this.projectPaths.Android.assets = path.join(
        workspaceDir,
        project.build.input.android.assets
      );
      this.projectPaths.Android.fonts = path.join(workspaceDir, 'config', 'Fonts');
      this.projectPaths.Android.config = path.join(workspaceDir, 'config');
      LogToConsole.instance.log('Configured project paths');
    } catch (e) {
      LogToConsole.instance.fatal('**ERROR** config/project.json does not exist or is broken', e);
      process.exit(1);
    }
  }

  getProjectPaths() {
    return this.projectPaths;
  }
}
