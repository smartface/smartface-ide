const fs = require('fs-extra');
const path = require("path");
const EventEmitter = require('events');
const utils = require('util');
const spawn = require("child_process").spawn;

const DEFAULT_PATHS = require("./config").DEFAULT_PATHS;
const getPath = require("./config").getPath;
const getProjectType = require("./config").getProjectType;
const PROJECT_TYPES = require("./config").PROJECT_TYPES;
const templateEngine = require("./core/templateEngine");
const util = require("./util");
const normalizePath = require("./util/normalizePath");
const Transpiler = require("./core/transpiler");
const styleGeneration = require("./core/generateStyles");
const TranspileLibrary = require("./transpileLibrary");
const modulesComps = require("./smfObject/modulesComps");
const { checkComponentsTestID, writePgx } = require('./testid-checker');
const { writeIdXml } = require('./prepare-id-xml');

const BRACKET_END = "$(B_R-A_C-K_E-T)";
const importExportRegex = /import|export/;

const isExistsFileDir = util.isExistsFileDir,
    handlePgx = util.readPgx,
    writeError = util.writeError,
    removeFile = util.removeFile,
    LIBRARY_FILE_NAME = DEFAULT_PATHS.LIBRARY_FILE_NAME,
    MODULES_FILE_NAME = DEFAULT_PATHS.MODULES_FILE_NAME;

function prepareOutputFilePath(projectType, uiFolder, fileName) {
    let res;
    if (projectType === PROJECT_TYPES.ts) {
        res = path.join(uiFolder, fileName, 'index.ts');
    } else {
        res = path.join(uiFolder, `ui_${fileName}.js`);
    }
    return res;
}

function createCommonFiles(projectType, uiFolder) {
    if (projectType === PROJECT_TYPES.ts) {
        const coreLibPath = getPath('CORE_LIB_FOLDER');
        util
            .isExistsFileDir(coreLibPath)
            .then(res => {
                if (!res.existing || (res.existing && res.dir)) {
                    util.mkdirpSync(path.dirname(coreLibPath));
                    fs.copy(path.join(__dirname, '..', 'assets', 'ts', 'core'), coreLibPath, (err) => {
                        if (err) return util.writeError(err, "Generate Common Files");
                    });
                }
            }, writeError);
    } else {

    }
}

function WatcherHandler(isStandalone) {
    EventEmitter.call(this);
    const libraryTranspiler = new TranspileLibrary();
    const projectType = getProjectType();
    const coreLibPath = path.relative(getPath('SCRIPTS_FOLDER'), getPath('CORE_LIB_FOLDER'));
    templateEngine.init();
    var transpiler = new Transpiler({
        template: templateEngine("page")
    }),
        emitGeneratedEvent = _emitGeneratedEvent.bind(this),
        userPageTemplate = templateEngine("userPage");

    const changeHandler = transpilerHandler.bind(this);
    const pgxFolder = getPath("PGX_FOLDER");
    const uiFolder = getPath("UI_FOLDER");
    const pagesFolder = getPath("PAGES_FOLDER");
    let watcherEnabledStatusFunc = () => { };
    modulesComps.startMarketplaceClient();
    libraryTranspiler.watchLibrary(path.join(pgxFolder, 'library'));
    libraryTranspiler.on("change", () => {
        transpileAllPgxFilesExceptLibraryFile();
    });

    //backward comp.
    function transpileLibraryPgx(filepath) {
        fs.readFile(filepath, "binary", (e, data) => {
            !e && libraryTranspiler.transpileComponents(JSON.parse(data));
        });
    }

    function transpileAllPgxFilesExceptLibraryFile() {
        fs.readdir(pgxFolder, (err, files) => {
            if (err)
                return console.error("transpileAllPgxFiles Error -> fs.readdir : pgxFolder -> " + err.toString());
            var promiseArr = [];
            files.filter(item => (item != "library" && item != LIBRARY_FILE_NAME) && (item !== MODULES_FILE_NAME))
                .forEach(item => {
                    promiseArr.push(changeHandler(path.join(pgxFolder, item), false));
                });
            if (isStandalone) {
                styleGeneration.initFolderPaths();
                promiseArr.push(styleGeneration.generateStyles());
            }
            Promise.all(promiseArr).then(async res => {
                if (isStandalone) {
                    await writeIdXml();
                    process.exit(0);
                }
            }).catch((err) => {
                console.error(err);
                isStandalone && process.exit(1);
            });
        });
    }

    function transpileAllPgxFiles() {
        transpileAllPgxFilesExceptLibraryFile();
    }

    function deleteScriptHandler(filename) {
        var filePath = prepareOutputFilePath(projectType, uiFolder, path.basename(filename, ".pgx"));
        removeFile(filePath).then(res => {
            console.log("Removed -> ", filePath);
        });
    }

    function transpilerHandler(filePath, classGeneration, trynum) {
        return handlePgx(filePath).then(async pgx => {
            if (!pgx) {
                if (!trynum || trynum < 5) {
                    console.log("├─\n├─ ! --> Empty Data retry " + (trynum ? trynum : 1) + "\n├─\n");
                    return setTimeout(_ => transpilerHandler.call(this, filePath, classGeneration, (trynum ? trynum + 1 : 1)), 300);
                }
                else {
                    console.log("Invalid PGX --> " + filePath);
                    throw new Error("Invalid PGX --> " + filePath);
                }
            }
            else {
                const dirtyPage = checkComponentsTestID(pgx);
                const parsedObjectData = transpiler.parse(pgx.components);
                //classGeneration !== false && styleGeneration.generateClassesMapAllFiles(path.dirname(filePath));
                const resFilePath = prepareOutputFilePath(projectType, uiFolder, path.basename(filePath, ".pgx"));
                parsedObjectData.coreLibPath = normalizePath(coreLibPath);
                if (parsedObjectData.initialized === false && !parsedObjectData.oldName) {
                    createUserPageIfDoesNotExist({
                        pageName: parsedObjectData.name,
                        designFilePath: normalizePath(path.relative(getPath('SCRIPTS_FOLDER'), path.dirname(resFilePath))),
                        coreLibPath: parsedObjectData.coreLibPath
                    });
                } else if (parsedObjectData.oldName) {
                    await movePageUserFile(parsedObjectData.name, parsedObjectData.oldName, pgx, filePath);
                }
                emitGeneratedEvent(transpiler.generate(parsedObjectData), resFilePath, true);
                if (dirtyPage) {
                    writePgx(filePath, pgx);
                }

                return resFilePath;
            }
        }, writeError);
    }

    function createUserPageIfDoesNotExist(opt) {
        var userFilePath = path.join(pagesFolder, `${opt.pageName}.${projectType}`);
        util.mkdirpSync(pagesFolder);
        isExistsFileDir(userFilePath)
            .then(res => {
                if (!res.existing || (res.existing && res.dir)) {
                    fs.writeFileSync(userFilePath, userPageTemplate(opt), "utf8");
                }
            }, writeError);
    }
    this.setWatcherEnabledStatusFunc = (_watcherEnabledStatusFunc) => watcherEnabledStatusFunc = _watcherEnabledStatusFunc;
    this.deleteScriptFile = deleteScriptHandler;
    this.changeHandler = transpilerHandler.bind(this);
    this.transpileAllPgxFiles = transpileAllPgxFiles.bind(this);
    this.transpileLibraryPgx = transpileLibraryPgx.bind(this);
    this.init = () => {
        libraryTranspiler.init().then(res => res);
        createCommonFiles(projectType, uiFolder);
    };

    function _emitGeneratedEvent(content, filePath, changed) {
        this.emit("readyFileContent", content, filePath, changed);
    }

    async function movePageUserFile(pageName, oldPageName, pgx, pgxFilePath) {
        const oldUserFilePath = path.join(pagesFolder, `${oldPageName}.${projectType}`);
        const newUserFilePath = path.join(pagesFolder, `${pageName}.${projectType}`);

        const existingResOld = await isExistsFileDir(oldUserFilePath);
        const existingResNew = await isExistsFileDir(newUserFilePath);
        console.log('|--- movePageUserFile \n|- ', oldUserFilePath, '\n|- ', newUserFilePath);
        if ((existingResOld.existing && !existingResOld.dir) && (!existingResNew.existing || (existingResNew.existing && existingResNew.dir))) {
            await fs.move(oldUserFilePath, newUserFilePath, { overwrite: true });
            await fixImportStatement(newUserFilePath, { name: pageName, oldName: oldPageName });
            watcherEnabledStatusFunc(false);
            try {
                await removeOldNameProp(pgx, pgxFilePath);
            } catch (e) {
                writeError({
                    file: newUserFilePath,
                    stack: e.stack,
                }, 'PageSourceFile Writing Error');
            }
            setTimeout(() => watcherEnabledStatusFunc(true), 400);
        } else {
            writeError({
                file: newUserFilePath,
                stack: `${oldUserFilePath}:  ${JSON.stringify(existingResOld)}\n${newUserFilePath}:  ${JSON.stringify(existingResNew)}`
            }, 'PageUserfiles Existing Error');
        }
    }

    async function fixImportStatement(newUserFilePath, compRes) {
        const oldVarName = util.capitalizeFirstLetter(compRes.oldName);
        const newVarName = util.capitalizeFirstLetter(compRes.name);

        const text = await fs.readFile(newUserFilePath, 'utf-8');
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            if (importExportRegex.test(line) && line.includes(oldVarName)) {
                lines[index] = line.replaceAll(oldVarName, newVarName).replaceAll(compRes.oldName, compRes.name);
            }
        });
        await fs.writeFile(newUserFilePath, lines.join('\n', 'utf-8'));
    }

    async function removeOldNameProp(content, pgxFilePath) {
        content.components[0].oldName = undefined;
        await fs.writeJSON(pgxFilePath, content, { spaces: '\t', overwrite: true });
    }

}



utils.inherits(WatcherHandler, EventEmitter);
module.exports = WatcherHandler;
