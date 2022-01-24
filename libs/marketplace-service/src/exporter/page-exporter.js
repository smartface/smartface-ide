const fs = require("fs");
const path = require("path");

const series = require('async/series');
const parallel = require('async/parallel');

const mkdirpSync = require("../util/mkdirp").sync;
const copyAssets = require("../lib/copyAssets");
const getClassNameList = require("../lib/getClassNameList");
const getLibraryModuleList = require("../lib/getLibraryModuleList");
const getFontList = require("../lib/getFontList");
const getLibraryComponents = require("../lib/getLibraryComponents");
const getComponentsWithChildren = require("../lib/getComponentsWithChildren");
const changeIds = require("../lib/changeIds");
const getImageList = require("../lib/getImageList");
const exportTheme = require("../lib/prepareThemes").exportTheme;
const getComponents = require("../lib/getComponents");
const createReadMe = require("../lib/createReadMe");
const writeError = require("../utility.js").writeError;
const toUniqueArray = require("../utility.js").toUniqueArray;

module.exports = opt => {
    var pgxFiles = (opt.pgxFile instanceof Array) ? opt.pgxFile : [opt.pgxFile];
    var _imageList = [],
        _fontList = [],
        _classNameList = [],
        _libComps = [];
    var _assetJSON = {
        name: opt.name,
        type: "page",
        title: opt.title,
        author: opt.author,
        description: opt.description,
        assets: [],
        imagePaths: [],
        version: opt.version || "1.0.0",
        readMePath: "README.md"
    };
    series({
        taskGetLibraryComponents: cb => {
            getLibraryComponents(opt)
                .then(res => {
                    _libComps = res;
                    cb();
                }, cb);
        },
        taskInit: cb => {
            mkdirpSync(opt.outputFolder);
            mkdirpSync(path.join(opt.outputFolder, ".ui"));
            mkdirpSync(path.join(opt.outputFolder, "preview"));
            cb(null);
        },
        taskExportOnePgx: cb => {
            parallel(
                pgxFiles.map(pgxFile => exportOnePgx.bind(null, pgxFile, opt, _libComps)),
                (err, results) => {
                    if (err) return cb(err);
                    results.forEach(res => {
                        _assetJSON.assets.push(res);
                        _assetJSON.imagePaths.push(res.previewPath);
                        _fontList = toUniqueArray(_fontList.concat(res.tempResources._fontList));
                        _imageList = toUniqueArray(_imageList.concat(res.tempResources._imageList));
                        _classNameList = toUniqueArray(_classNameList.concat(res.tempResources._classNameList));
                        res.tempResources = undefined;
                    });
                    cb(null);
                });
        }
    }, (err, res) => {
        if (err)
            return writeError(err, "Item Exporting Error");
        parallel({
            taskCopyImages: cb => {
                copyAssets(_imageList, path.join(opt.outputFolder, "images"), {
                    no_target_folder: true
                }).then(res => cb(), cb);
            },
            taskCopyFonts: cb => {
                copyAssets(
                    _fontList,
                    path.join(opt.outputFolder, 'config', 'Fonts')
                ).then(res => cb(), cb);
            },
            taskCreateAssetJSon: cb => {
                fs.writeFile(
                    path.join(opt.outputFolder, "asset.json"),
                    JSON.stringify(_assetJSON, null, '\t'),
                    "utf-8",
                    cb
                );
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

function exportOnePgx(pgxFile, opt, _libComps, _cb) {
    var _components, _imageList, _fontList, _classNameList, _assetJSON, _libModuleNames, __bundleTheme;
    console.log("Exporting item...");
    series({
        taskGetComponents: cb => {
            getComponents(pgxFile).then(components => {
                _components = components.concat(_libComps);
                _components = getComponentsWithChildren(_components, _components[0].id, true);
                _libModuleNames = getLibraryModuleList(_components);
                if (_libModuleNames.moduleComps.length > 0) {
                    return cb({
                        err: "Invalid Component",
                        stack: "You cannot export another marketplace component -> " +
                            _libModuleNames.moduleComps.join(", ")
                    });
                }
                changeIds(_components);
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
                path.join("themes", _components[0].props.name + "_style.json")
            ).then(resTheme => {
                __bundleTheme = resTheme;
                cb();
            }, cb);
        },
        taskGetImageListAndInit: cb => {
            _fontList = getFontList(opt.fontsFolder, _components, __bundleTheme);
            getImageList(opt.imagesFolder, _components, opt.name + "_", __bundleTheme)
                .then(imageAssetsProps => {
                    _imageList = imageAssetsProps.assets;
                    _assetJSON = {
                        name: _components[0].props.name,
                        viewPath: `.ui/${_components[0].props.name}.pgx`,
                        previewPath: `preview/${_components[0].props.name}.png`,
                        themePath: path.join("themes", _components[0].props.name + "_style.json"),
                        tempResources: {
                            _imageList,
                            _classNameList,
                            _fontList
                        },
                        resources: {
                            images: Array.from(new Set(_imageList.map(image => image.name))),
                            fonts: _fontList.map(font => font.name),
                            classNames: _classNameList
                        },
                        library: _libModuleNames.libComps,
                        dependencies: _libModuleNames.moduleComps
                    };
                    cb();
                }, cb);
        }
    }, (err, res) => {
        if (err)
            return writeError(err, "Item Exporting Error");
        parallel({
            taskCopyPgxFile: cb => {
                //_components[0].props.name = opt.name;
                fs.writeFile(
                    path.join(opt.outputFolder, _assetJSON.viewPath),
                    JSON.stringify({ components: _components }, null, "\t"),
                    cb
                );
            }
        }, (err, res) => {
            if (err)
                return _cb(err);
            _cb(null, _assetJSON);
        });
    });
}
/*
node modules-manager --task export --assetType template --pgxFile ~/workspace/workspace/.ui/page2.pgx --wsPath ~/workspace/workspace --outputFolder /home/ubuntu/workspace/workspace/.templates/page2template --name=page2 --title="Page 2" --description="This is page2" --version="1.1.0"

*/
