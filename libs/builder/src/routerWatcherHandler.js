const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

const recursiveReaddir = require('recursive-readdir');

const util = require('./util');
const templateEngine = require('./core/templateEngine');
const { getPath } = require('./config');
const parseRouterFile = require('./smfObject/routerParser');
const { queue } = require('async');

class RouterWatcherHandler extends EventEmitter {
  isStandAlone = false;
  routerTemplate;
  userRouterTemplate;
  libRouterTemplate;
  userLibRouterTemplate;
  routerPath = getPath('ROUTER_UI_FOLDER');
  uiFolder = getPath('UI_FOLDER');
  routerFolder = getPath('ROUTER_FOLDER');
  userRouterFolder = getPath('ROUTER_USER_FOLDER');
  scriptsFolder = getPath('SCRIPTS_FOLDER');
  userComponentsPath;

  constructor(isStandAlone) {
    super();
    this.isStandAlone = isStandAlone;
    this.routerTemplate = templateEngine('router');
    this.userRouterTemplate = templateEngine('userRouter');
    this.libRouterTemplate = templateEngine('libRouter');
    this.userLibRouterTemplate = templateEngine('userLibRouter');
    this.userComponentsPath = path.join(this.userRouterFolder, 'components');
    this.createRouteHelperSrc();
  }

  async createRouteHelperSrc() {
    const srcFilePath = path.join(this.routerPath, 'RouteHelper.ts');
    fs.copy(getPath('ROUTEHELPER_SRC_FILE'), srcFilePath, { overwrite: true });
  }

  async transpileAllRouterFiles() {
    const routerFileName = path.join(this.routerFolder, 'index.rtr');
    const routerLibraryDir = path.join(this.routerFolder, 'library');
    let routers;
    try {
      const libFiles = await recursiveReaddir(routerLibraryDir);
      routers = await util.readRouterFile(routerFileName);
      let libChildren = [];
      const q = queue(async filePath => {
        const data = await util.readJSON(filePath);
        libChildren.push(data[0].id);
        data.forEach(d => (routers.componentByID[d.id] = d));
      }, 10);
      await new Promise((resolve, reject) => {
        q.drain = () => {
          routers.componentByID[routers.libRoot].children = libChildren;
          resolve(routers);
        };
        q.push(libFiles);
      });
      routers = parseRouterFile(routers);
    } catch (e) {
      return util.writeError(e, 'Router Parser');
    }
    await this.createGenLibRouters(routers);
    await this.createGenAppRouterFile(routers);
  }

  async createGenAppRouterFile(routers) {
    const codeData = this.routerTemplate({ routers: routers.appRouters, imports: routers.imports });
    const filePath = path.join(this.routerPath, 'index.ts');
    await fs.writeFile(filePath, codeData, 'utf8');
    console.log('├─ 🔀    Generated ' + path.relative(this.routerPath, filePath));
    const genAppRouterName = routers.appRouters[0].varName;
    await this.createAppUserFileIfNeeded({
      varName: 'MainRouter',
      name: genAppRouterName,
      from: path.relative(this.scriptsFolder, this.routerPath).replace('.ts', '')
    });
  }

  async createGenLibRouters(routers) {
    const libRouterPath = path.join(this.routerPath, 'components');
    await util.createClearDir(libRouterPath);
    await this.createSafeLibComponentsDir();
    await Promise.all(
      routers.libRouters.map(async libRouterObj => {
        const codeData = this.libRouterTemplate({
          routers: libRouterObj.routers,
          imports: libRouterObj.imports
        });
        const filePath = path.join(libRouterPath, `${libRouterObj.fileName}.ts`);
        await fs.writeFile(filePath, codeData, 'utf8');
        console.log('├─ 🔀📘  Generated ' + path.relative(this.routerPath, filePath));
        await this.createLibUserFileIfNeeded({
          genFilePath: filePath,
          fileName: libRouterObj.fileName
        });
      })
    );
  }

  async createSafeLibComponentsDir() {
    const res = await util.isExistsFileDir(this.userComponentsPath);
    if (!res.existing || (res.existing && !res.dir)) {
      util.mkdirpSync(this.userComponentsPath);
    }
  }

  async createLibUserFileIfNeeded({ fileName, genFilePath }) {
    const filePath = path.join(this.userComponentsPath, `${fileName}.ts`);
    const res = await util.isExistsFileDir(filePath);
    if (!res.existing || (res.existing && !res.file)) {
      const codeData = this.userLibRouterTemplate({
        varName: fileName,
        baseRouter: `$$${fileName}`,
        imports: [
          {
            name: `$$${fileName}`,
            from: path.relative(this.scriptsFolder, genFilePath).replace('.ts', '')
          }
        ]
      });
      await fs.writeFile(filePath, codeData, 'utf8');
      console.log(
        '├─ 🔀📘  Generated User File ' + path.relative(this.userComponentsPath, filePath)
      );
    }
  }

  async createAppUserFileIfNeeded({ varName, name, from }) {
    const filePath = path.join(this.userRouterFolder, `index.ts`);
    const res = await util.isExistsFileDir(filePath);
    if (!res.existing || (res.existing && !res.file)) {
      util.mkdirpSync(this.userRouterFolder);
      const codeData = this.userRouterTemplate({
        varName,
        name,
        from
      });
      await fs.writeFile(filePath, codeData, 'utf8');
      console.log('├─ 🔀    Generated User File ' + path.relative(this.userRouterFolder, filePath));
    }
  }
}

module.exports = RouterWatcherHandler;
