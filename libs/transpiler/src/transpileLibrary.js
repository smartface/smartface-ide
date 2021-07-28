const fs = require("fs-extra");
const path = require("path");
const EventEmitter = require('events');
const utils = require('util');

const { getPath, getProjectType, PROJECT_TYPES } = require("./config");
const templateEngine = require("./core/templateEngine");
const util = require("./util");
const Transpiler = require("./core/transpiler");
const prepareLibComps = require("./smfObject/libComps").prepareLibComps;
const generateStylerBuilder = require("./util/generateStylerBuilder");
const watchLibrary = require("./service-clients/watch-library");
const normalizePath = require("./util/normalizePath");
const writeError = util.writeError;

function prepareOutputFilePath(projectType, uiFolder, fileName){
    let res;
    if(projectType === PROJECT_TYPES.ts) {
        res = path.join(uiFolder, `${fileName}.ts`);
    } else {
        res = path.join(uiFolder, `${fileName}.js`);
    }
    return res;
}

function TranspileLibrary() {
  EventEmitter.call(this);
  const projectType = getProjectType();
  const coreLibPath = path.relative(getPath('SCRIPTS_FOLDER'), getPath('CORE_LIB_FOLDER'));
  var transpilers = {},
    __libraryPageData,
    pageTranspiler = new Transpiler({
      template: templateEngine("page")
    }),
    templateUserFile = templateEngine("userFile"),
    templateComponent = templateEngine("component");
  const emit = _emit.bind(this);
  const libraryUiFolder = getPath("LIBRARY_UI_FOLDER");
  const libraryUserFolder = getPath("LIBRARY_USER_FOLDER");

  function transpilerHandler() {
    var parsedObjectData = pageTranspiler.parse(__libraryPageData);
    setTranspilersAsPassive();
    util.mkdirpSync(libraryUserFolder);
    prepareLibComps(parsedObjectData).forEach(comp => {
      console.log('coreLibPath : ', coreLibPath);

      comp.coreLibPath = normalizePath(coreLibPath);
      var res = generateOneComponent(comp);
      if (createComponentFile(res)) {
        generateStylerBuilder(libraryUiFolder, {
          initialization: true
        }).then(res => res);
      }!res.initialized && createLibraryUserFileIfDoesNotExist(res);
    });
    removePassiveComponentFiles();
  }

  function generateOneComponent(comp) {
    var res = {
      cotent: null,
      name: comp.libraryType,
      requirePath: normalizePath(path.relative(getPath('SCRIPTS_FOLDER'), path.join(libraryUiFolder, comp.libraryType))),
      hasLayoutProps: !!comp.layoutProps,
      initialized: comp.initialized,
      changed: false
    };
    if (!comp.libraryType) {
      util.writeError(new Error("component.'libraryType' -> " + comp.libraryType));
      res.error = true;
      return res;
    }
    let tranp = transpilers[comp.libraryType];
    res.content = templateComponent(comp);
    res.changed = true;
    if (!tranp) {
        tranp = {};
        transpilers[comp.libraryType] = tranp;
    }
    tranp.active = true;
    return res;
  }

  function setTranspilersAsPassive() {
    for (var tranp in transpilers) {
      transpilers[tranp].active = false;
    }
  }

  function removePassiveComponentFiles() {
    for (var tranp in transpilers) {
      if (!transpilers[tranp].active) {
        const filePath = prepareOutputFilePath(projectType, libraryUiFolder, tranp);
        util.removeFile(filePath).then(res => {
          res && (delete transpilers[tranp]);
        });
      }
    }
  }

  function createComponentFile(opt) {
    if (opt.error)
      return;
    if (!opt.changed && opt.content) {
      return console.log(" Component already created -> " + opt.name);
    }
    var filePath =  prepareOutputFilePath(projectType, libraryUiFolder, opt.name);
    var islibFolderExists = util.mkdirpSync(path.dirname(filePath));
    fs.writeFileSync(filePath, opt.content, "utf8");
    console.log("├─ 📗  generated " + path.relative(libraryUiFolder, filePath));
    return islibFolderExists;
  }

  function createLibraryUserFileIfDoesNotExist(opt) {
    const userFilePath = prepareOutputFilePath(projectType, getPath("LIBRARY_USER_FOLDER"), opt.name);
    util
      .isExistsFileDir(userFilePath)
      .then(res => {
        if (!res.existing || (res.existing && res.dir)) {
          fs.writeFileSync(userFilePath, templateUserFile(opt), "utf8");
        }
      }, util.writeError);
  }

  function init() {
    util.mkdirpSync(libraryUiFolder);
    return generateStylerBuilder(libraryUiFolder, {
      initialization: true
    });
  }

  this.watchLibrary = (libraryFolder) => {
    watchLibrary(libraryFolder, (err, libraryPageData) => {
      if (err)
        return writeError(err, "ReadLibraryComps Error");
      __libraryPageData = libraryPageData;
      this.transpileComponents();
      emit("change");
    });
  }
  this.transpileComponents = transpilerHandler.bind(this);
  this.init = init.bind(this);

  function _emit(eventName) {
    this.emit(eventName);
  }
}


utils.inherits(TranspileLibrary, EventEmitter);
module.exports = TranspileLibrary;
