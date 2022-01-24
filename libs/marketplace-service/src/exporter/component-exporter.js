const fs = require("fs");
const path = require("path");
const spawn = require("child_process").spawn;

const series = require('async/series');
const parallel = require('async/parallel');

const mkdirpSync = require("../util/mkdirp").sync;
const copyAssets = require("../lib/copyAssets");
const getClassNameList = require("../lib/getClassNameList");
const getFontList = require("../lib/getFontList");
const changeIds = require("../lib/changeIds");
const getImageList = require("../lib/getImageList");
const getLibraryComponents = require("../lib/getLibraryComponents");
const exportTheme = require("../lib/prepareThemes").exportTheme;
const getComponents = require("../lib/getComponents");
const createReadMe = require("../lib/createReadMe");
const getComponentsWithChildren = require("../lib/getComponentsWithChildren");
const getLibraryModuleList = require("../lib/getLibraryModuleList");
const writeError = require("../utility.js").writeError;
const capitalizeFirstLetter = require("../utility.js").capitalizeFirstLetter;

const BRACKET_END = "$(B_R-A_C-K_E-T)";
const MODULES_PAGE_NAME = "__modules__";

module.exports = opt => {
    var _components, _imageList, _fontList, _classNameList, _libModuleNames, _assetJSON, __compName, __bundleTheme;
    console.log("Exporting item...");
    series({
        taskGetLibraryComponents: cb => {
            getLibraryComponents(opt)
                .then(res => {
                    _components = res;
                    cb();
                }, cb);
        },
        taskGetComponents: cb => {
            getComponents(opt.pgxFile).then(components => {
                _libModuleNames = getLibraryModuleList(
                    getComponentsWithChildren(_components.concat(components), opt.componentID)
                );
                _components = getComponentsWithChildren(_components.concat(components), opt.componentID, true);
                if (!_components[0])
                    return cb({ err: "Component Error", msg: "Component couldn't be found. Please ensure to save page before exporting." });
                __compName = _components[0].props.name;
                cb();
            }, cb);
        },
        taskCopyThemes: cb => {
            _classNameList = getClassNameList(_components);
            exportTheme(
                _classNameList,
                opt.settingsPath,
                opt.bundleThemesFolder,
                path.join(opt.outputFolder),
                path.join("themes", opt.name + "_style.json")
            ).then((resTheme) => {
                __bundleTheme = resTheme;
                cb();
            }, cb);
        },
        taskGetImageList: cb => {
            getImageList(opt.imagesFolder, _components, opt.name + "_", __bundleTheme)
                .then(imageAssetsProps => {
                    _imageList = imageAssetsProps.assets;
                    cb();
                }, cb);
        },
        taskInitFolders: cb => {
            changeIds(_components);
            _fontList = getFontList(opt.fontsFolder, _components, __bundleTheme);
            if (_libModuleNames.moduleComps.length > 0) {
                return cb({
                    err: "Invalid Component",
                    stack: "You cannot export another marketplace component -> " +
                        _libModuleNames.moduleComps.join(", ")
                });
            }
            mkdirpSync(opt.outputFolder);
            _assetJSON = {
                name: opt.name,
                type: "library",
                title: opt.title,
                author: opt.author,
                description: opt.description,
                themePath: path.join("themes", opt.name + "_style.json"),
                resources: {
                    images: Array.from(new Set(_imageList.map(image => image.name))),
                    fonts: _fontList.map(font => font.name),
                    classNames: _classNameList
                },
                dependencies: _libModuleNames.moduleComps,
                imagePaths: [
                    `preview/${__compName}.png`
                ],
                version: opt.version || "1.0.0",
                readMePath: "README.md"
            };
            cb();
        }
    }, (err, res) => {
        if (err)
            return writeError(err, "Item Exporting Error");
        parallel({
            taskCopyImages: cb => {
                copyAssets(
                        _imageList,
                        path.join(opt.outputFolder, "images"), {
                            no_target_folder: true
                        })
                    .then(() => cb(), cb);
            },
            taskCopyFonts: cb => {
                copyAssets(
                    _fontList,
                    path.join(opt.outputFolder, 'config', 'Fonts')
                ).then(() => cb(), cb);
            },
            taskCreateViewJSON: cb => {
                if (_components[0]) {
                    _components[0].props.name = opt.name;
                    _components[0].source = Object.assign({}, _components[0].source, {
                        page: MODULES_PAGE_NAME,
                        moduleName: capitalizeFirstLetter(opt.name),
                        modulePath: opt.name
                    });
                }
                fs.writeFile(
                    path.join(opt.outputFolder, "view.json"),
                    JSON.stringify({
                        components: _components
                    }, null, "\t"),
                    cb
                );
            },
            taskCopySource: cb => {
                var compsFolder = path.join(opt.outputFolder, "components");
                var libraryFolder = path.join(opt.outputFolder, "node_modules", "library");
                mkdirpSync(libraryFolder);
                mkdirpSync(compsFolder);
                //console.dir(_libModuleNames);
                _libModuleNames.libComps.unshift(__compName);
                copyAssets(_libModuleNames.libComps.map(compName => {
                    return {
                        src: path.join(opt.componentsFolder, capitalizeFirstLetter(compName) + ".js"),
                        relPath: ``
                    };
                }), compsFolder).then(res => cb, cb);
                copyAssets(_libModuleNames.libComps.map(compName => {
                    return {
                        src: path.join(opt.libraryScriptsFolder, capitalizeFirstLetter(compName) + ".js"),
                        relPath: ""
                    };
                }), libraryFolder).then(res => cb(), cb);

            },
            taskCreateIndexJS: cb => {
                fs.writeFile(path.join(opt.outputFolder, "index.js"),
                    `module.exports = require("./components/${capitalizeFirstLetter(__compName)}");`,
                    "utf-8",
                    cb
                );
            },
            taskCreateAssetJSon: cb => {
                fs.writeFile(
                    path.join(opt.outputFolder, "asset.json"),
                    JSON.stringify(_assetJSON, null, '\t'),
                    "utf-8",
                    cb
                );
                fs.writeFile(path.join(opt.outputFolder, "package.json"), "{}", "utf-8");
            },
            taskCreateReadMeMD: cb => {
                createReadMe(_assetJSON, opt.outputFolder, cb);
            }
        }, (err, res) => {
            if (err)
                return writeError(err, "Item Exporting Error");
            console.log("Item export successful.");
        });
    });
};


/* 
example command:

node modules-manager --task export --assetType component --pgxFile ~/workspace/workspace/.ui/library/index.pgx --imagesFolder ~/workspace/workspace/images --wsPath ~/workspace/workspace --outputFolder /home/ubuntu/workspace/workspace/.smf/modules/smflayouut --name smfLayout --title "Page2 Tempalte" --componentID "88bc-e14c-17d7-b48b"

*/
