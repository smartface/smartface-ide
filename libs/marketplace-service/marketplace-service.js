#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const __args = require('minimist')(process.argv.slice(2));
var program = require('commander');

const taskHandler = require("./src/task-handler");
const writeError = require("./src/utility.js").writeError;
const isValidName = require("./src/util/isValidName");

const ENV_PATH = process.env.ENV_PATH || path.join('.smf', '.env');

process.on('uncaughtException', (err) => {
    writeError({
        err: "Uncaught Exception",
        stack: err.stack,
        msg: err.toString(),
        kill: false
    });
});

process.on('unhandledRejection', (reason) => {
    writeError({
        err: "Unhandled Rejection",
        stack: reason.stack,
        msg: reason.toString(),
        kill: false
    });
});

var checkRes = isValidName(__args.name || "");
if (__args.task === "export" && !checkRes.isValid)
    return writeError(`${__args.name} ` + checkRes.errors.join(""), "Name Error");

//taskHandler(args.task, args.assetType, );
function getOptions(_args) {
    var args = Object.assign({}, _args);
    args.wsPath = args.wsPath || process.env.SMF_CIDE_WS_PATH || path.join(process.env.HOME, "workspace");
    //console.log("WS_PATH: ", args.wsPath);
    return Object.assign({}, args, {
        //import
        packageFolder: args.packageFolder,
        restart: args.restart || args.r,
        //export
        componentID: args.componentID,
        pgxFile: args.pgxFile,
        //common
        token: getToken(args),
        ownerId: getOwnerId(args),
        wsPath: args.wsPath,
        tempFolder: args.tempFolder || path.join(args.wsPath, ".tmp"),
        componentsFolder: args.componentsFolder || path.join(args.wsPath, 'scripts', 'components'),
        libraryScriptsFolder: args.libraryScriptsFolder || path.join(args.wsPath, 'scripts', 'node_modules', 'library'),
        libraryUiFolder: args.libraryUiFolder || path.join(args.wsPath, '.ui', 'library'),
        imagesFolder: args.imagesFolder || path.join(args.wsPath, "images"),
        fontsFolder: args.fontsFolder || path.join(args.wsPath, 'config', 'Fonts'),
        settingsPath: args.settingsPath || path.join(args.wsPath, 'scripts','settings.json'),
        themesFolder: args.themesFolder || path.join(args.wsPath, 'themes'),
        bundleThemesFolder: args.bundleThemesFolder || path.join(args.wsPath, 'scripts', 'themes'),
        outputFolder: args.outputFolder,
        name: args.name,
        title: args.title,
        author: args.author,
        description: args.description,
        access: args.access,
        version: args.version,
        //install
        save: args.save,
        downloadUrl: args.downloadUrl,
        getToken: getToken.bind(null, args),
        getOwnerId: getOwnerId.bind(null, args)
    });
}

function getEnvData(args) {
    try {
        return JSON.parse(fs.readFileSync(path.join(args.wsPath, ENV_PATH), "utf-8"));
    }
    catch (e) {}
    return {};
}

function getToken(args) {
    var res = args.token;
    try {
        res = args.token || getEnvData(args).token;
    }
    catch (e) {}
    return res;
}

function getOwnerId(args) {
    var res = args.ownerId;
    try {
        var data = getEnvData(args);
        res = args.ownerId || JSON.parse(data.userInfo.owner).Id;
    }
    catch (e) {}
    return res;
}



program
    .command("serviceStart")
    .option('-r, --restart [value]', 'restart flag')
    .action(cmd => {
        taskHandler("serviceStart", cmd.type, getOptions(cmd));
    });

program
    .command('install')
    .option('--wsPath [value]', 'workspace path')
    .action(cmd => {
        taskHandler("install", cmd.type, getOptions(cmd));
    });

program
    .command('import <type>')
    .option('--wsPath [value]', 'workspace path')
    .option('--packageFolder [value]', 'package folder path')
    .option('--outputFolder [value]', 'output package folder path')
    .action((type, cmd) => {
        taskHandler("import", type, getOptions(cmd));
    });

program
    .command('uninstall <name>')
    .option('--wsPath [value]', 'workspace path')
    .action((name, cmd) => {
        cmd.name = name;
        taskHandler("uninstall", cmd.type, getOptions(cmd));
    });

program
    .command("export <type>")
    .option('--wsPath [value]', 'workspace path')
    .option('--pgxFile [value]', 'design file path')
    .option('--componentID [value]', 'will be exported component id')
    .option('--outputFolder [value]', 'output package folder path')
    .option('--title [value]', 'package title')
    .option('--version [value]', 'package version')
    .option('--author [value]', 'package author')
    .option('--name [value]', 'package name')
    .option('--description [value]', 'package description')
    .action((type, cmd) => {
        if (!isValidName(cmd.name || "").isValid)
            return writeError(`'${cmd.name}' ` + checkRes.errors.join(""), "Invalid Name");

        taskHandler("export", type, getOptions(cmd));
    });

program
    .command("publish")
    .option('--wsPath [value]', 'workspace path')
    .option('--token [value]', 'authorization token')
    .option('--access [value]', 'package access type (private, public)')
    .option('--packageFolder [value]', 'package folder path')
    .option('--ownerId [value]', 'ownerId')
    .action(cmd => {
        taskHandler("publish", cmd.type, getOptions(cmd));
    });

program
    .command("version")
    .action(cmd => {
        console.log(require('./package.json').version);
    });

program.parse(process.argv);
