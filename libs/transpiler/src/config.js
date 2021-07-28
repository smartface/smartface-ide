const path = require('path');
const fs = require('fs-extra');
const util = require('./util');
var args = require('minimist')(process.argv.slice(2));

const rootPath = args.rootPath || path.parse(process.env.ROOT_PATH);
const WORKSPACE_NAME = rootPath.dir;
const WORKSPACE_PATH = rootPath.toString();
const CONFIG_FILE_PATH = path.join(WORKSPACE_PATH, 'scripts', 'settings.json');
const UI_FOLDER = process.env.SMF_SCRIPTS_FOLDER || path.join(WORKSPACE_PATH, 'scripts', 'ui');

const PROJECT_TYPES = {
  js: 'js',
  ts: 'ts'
};

const FORMATTER_SETTINGS = {
  useTabs: true,
  singleQuote: true,
  parser: 'typescript',
  printWidth: 150
};

const DEFAULT_PATHS = {
  STYLER_UTIL_FILE: path.join(__dirname, '..', 'assets', 'styler-builder.js'),
  LIBRARY_FILE_NAME: '__library__.pgx',
  LIBRARY_PAGE_NAME: '__library__',
  MODULES_PAGE_NAME: '__modules__',
  MODULES_FILE_NAME: '.__modules__.pgx',
  ...getWorkspaceRelativePaths(WORKSPACE_PATH)
};

function getWorkspaceRelativePaths(workspacePath) {
  return {
    WORKSPACE_PATH: workspacePath,
    PGX_FOLDER: path.join(workspacePath, '.ui'),
    SCRIPTS_FOLDER: path.join(workspacePath, 'scripts'),
    UI_FOLDER: path.join(workspacePath, 'scripts', 'ui'),
    PAGES_FOLDER: path.join(workspacePath, 'scripts', 'pages'),
    CORE_LIB_FOLDER: path.join(workspacePath, 'scripts', 'core'),
    LIBRARY_UI_FOLDER: path.join(workspacePath, 'scripts', 'node_modules', 'library'),
    LIBRARY_USER_FOLDER: path.join(workspacePath, 'scripts', 'components'),
    THEMES_FOLDER: path.join(workspacePath, 'themes'),
    THEMES_DIST_FOLDER: path.join(workspacePath, 'scripts', 'themes'),
    ANDROID_ID_XML: path.join(workspacePath, 'config', 'Android', 'ids.xml')
  };
}

const CONSTANTS = {
  defaultsTheme: 'defaultTheme',
  workspaceTheme: `${WORKSPACE_NAME}Theme`
};

let SETTINGS = { config: { theme: '' } };
let SETTINGS_STRING = null;
const UPDATED_PATHS = { ...DEFAULT_PATHS };
let _configFile;

delete UPDATED_PATHS.STYLER_UTIL_FILE;

function initPathsFromConfigFile(configFilePath) {
  _configFile = configFilePath || CONFIG_FILE_PATH;
  let settings;
  try {
    SETTINGS = settings = fs.readJsonSync(_configFile);
    var settings_string = JSON.stringify(settings);
  } catch (exp) {
    util.writeError(exp, 'Config File Error');
    return exp;
  }
  if (SETTINGS_STRING === settings_string) {
    console.log('Config File did not change');
    return 'same config file';
  }
  SETTINGS_STRING = settings_string;

  const defaultPaths = settings.config.paths;

  if (defaultPaths) {
    defaultPaths.pgxFolder && (UPDATED_PATHS.PGX_FOLDER = pathJoinWithWorkspace(defaultPaths.pgxFolder));
    if (defaultPaths.uiFolder) {
      UPDATED_PATHS.UI_FOLDER = pathJoinWithWorkspace(defaultPaths.uiFolder);
      UPDATED_PATHS.CORE_LIB_FOLDER = path.join(path.dirname(pathJoinWithWorkspace(defaultPaths.uiFolder)), 'core');
    }
    defaultPaths.libraryUiFolder && (UPDATED_PATHS.LIBRARY_UI_FOLDER = pathJoinWithWorkspace(defaultPaths.libraryUiFolder));
    defaultPaths.libraryUserFolder && (UPDATED_PATHS.LIBRARY_USER_FOLDER = pathJoinWithWorkspace(defaultPaths.libraryUserFolder));
    defaultPaths.themesFolder && (UPDATED_PATHS.THEMES_FOLDER = pathJoinWithWorkspace(defaultPaths.themesFolder));
    defaultPaths.themesDistFolder && (UPDATED_PATHS.THEMES_DIST_FOLDER = pathJoinWithWorkspace(defaultPaths.themesDistFolder));
    if (defaultPaths.pagesFolder) {
      UPDATED_PATHS.PAGES_FOLDER = pathJoinWithWorkspace(defaultPaths.pagesFolder);
    }
  }
}

function pathJoinWithWorkspace(_path) {
  return path.join(UPDATED_PATHS.WORKSPACE_PATH, _path);
}

function setWorkspacePath(_path) {
  UPDATED_PATHS.WORKSPACE_PATH = _path;
  Object.assign(UPDATED_PATHS, getWorkspaceRelativePaths(_path));
}

function initPathsFromArgs(args) {
  args.pgxFolder && (UPDATED_PATHS.PGX_FOLDER = args.pgxFolder);
  if (args.scriptsFolder) {
    UPDATED_PATHS.UI_FOLDER = args.scriptsFolder;
    UPDATED_PATHS.LIBRARY_UI_FOLDER = path.join(path.dirname(args.scriptsFolder), 'node_modules', 'library');
    UPDATED_PATHS.LIBRARY_USER_FOLDER = path.join(path.dirname(args.scriptsFolder), 'components');
    UPDATED_PATHS.THEMES_FOLDER = path.join(path.dirname(args.scriptsFolder), '..', 'themes');
    UPDATED_PATHS.THEMES_DIST_FOLDER = path.join(args.scriptsFolder, '..', 'themes');
    UPDATED_PATHS.PAGES_FOLDER = path.join(args.scriptsFolder, 'pages');
    UPDATED_PATHS.CORE_LIB_FOLDER = path.join(args.scriptsFolder, 'core');
  }
}

function getPath(key) {
  return UPDATED_PATHS[key];
}

function writeInfo() {
  console.log('├─ ⚙️  ────────────────────────── Configuration ───────────────────────────────────┤');
  for (const key in UPDATED_PATHS) {
    console.log(`├─ ⚫  ${key} ${' '.repeat(20 - key.length)} ${UPDATED_PATHS[key]}`);
  }
  console.log('├─');
}

function getSettings() {
  return SETTINGS;
}

function getProjectType() {
  return PROJECT_TYPES[SETTINGS.config.projectType] || PROJECT_TYPES.js;
}

function getFormatterSettings() {
  return { ...FORMATTER_SETTINGS, ...SETTINGS.config.formatterSettings };
}

module.exports.DEFAULT_PATHS = DEFAULT_PATHS;
module.exports.CONSTANTS = CONSTANTS;
module.exports.PROJECT_TYPES = PROJECT_TYPES;
module.exports.getPath = getPath;
module.exports.writeInfo = writeInfo;
module.exports.getSettings = getSettings;
module.exports.getProjectType = getProjectType;
module.exports.getFormatterSettings = getFormatterSettings;
module.exports.setWorkspacePath = setWorkspacePath;
module.exports.initPathsFromArgs = initPathsFromArgs;
module.exports.initPathsFromConfigFile = initPathsFromConfigFile;
/*
  ,
    "paths": {
      "pgxFolder": ".ui",
      "uiFolder": "scripts/ui",
      "pagesFolder": "pages",
      "libraryUiFolder": "scripts/node_modules/library",
      "libraryUserFolder": "scripts/components",
      "themesFolder": "themes",
      "themesDistFolder": "scripts/themes"
    }
*/
