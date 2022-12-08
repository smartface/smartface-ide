const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');
const util = require('./util');
const templateEngine = require('./core/templateEngine');
const { getPath } = require('./config');
const parseRouterFile = require('./smfObject/routerParser');

class RouterWatcherHandler extends EventEmitter {
  isStandAlone = false;
  routerTemplate;
  libRouterTemplate;
  routerPath = getPath('ROUTER_UI_FOLDER');
  uiFolder = getPath('UI_FOLDER');
  routerFolder = getPath('ROUTER_FOLDER');

  constructor(isStandAlone) {
    super();
    this.isStandAlone = isStandAlone;
    this.routerTemplate = templateEngine('router');
    this.libRouterTemplate = templateEngine('libRouter');
  }

  async transpileAllRouterFiles() {
    const routerFileName = path.join(this.routerFolder, 'index.rtr');
    let routers;
    try {
      routers = await util.readRouterFile(routerFileName);
      routers = parseRouterFile(routers);
    } catch (e) {
      return util.writeError(e, 'Router Parser');
    }
    await this.createGenAppRouterFile(routers);
    await this.createGenLibRouters(routers);
  }

  async createGenAppRouterFile(routers) {
    const codeData = this.routerTemplate({ routers: routers.appRouters, imports: routers.imports });
    const filePath = path.join(this.routerPath, 'index.ts');
    await fs.writeFile(filePath, codeData, 'utf8');
    console.log('├─ 🔀  Generated ' + path.relative(this.routerPath, filePath));
  }

  async createGenLibRouters(routers) {
    const libRouterPath = path.join(this.routerPath, 'components');
    await util.createClearDir(libRouterPath);
    await Promise.all(
      routers.libRouters.map(async libRouterObj => {
        const codeData = this.libRouterTemplate({
          routers: libRouterObj.routers,
          imports: libRouterObj.imports
        });
        const filePath = path.join(libRouterPath, `${libRouterObj.fileName}.ts`);
        await fs.writeFile(filePath, codeData, 'utf8');
        console.log('├─ 🔀📘  Generated ' + path.relative(this.routerPath, filePath));
      })
    );
  }
}

module.exports = RouterWatcherHandler;
