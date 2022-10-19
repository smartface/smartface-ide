const fs = require("fs");

const prettier = require("prettier");
const Handlebars = require("handlebars");

const getFormatterSettings = require("../config").getFormatterSettings;
const getProjectType = require("../config").getProjectType;

function readModuleFile(path) {
  return fs.readFileSync(__dirname + "/" + path, 'utf8');
}

const src = {
  header: (projectType) => `../template/${projectType}/_header.hbs`,
  body: (projectType) => `../template/${projectType}/_body.hbs`,
  footer: (projectType) => `../template/${projectType}/_footer.hbs`,
  onLoad: (projectType) => `../template/${projectType}/_onLoad.hbs`,
  page: (projectType) => `../template/${projectType}/page.hbs`,
  repeatboxExampleData: (projectType) => `../template/${projectType}/_repeatBoxExampleData.hbs`,
  require: (projectType) => `../template/${projectType}/_require.hbs`,
  font: (projectType) => `../template/${projectType}/_font.hbs`,
  component: (projectType) => `../template/${projectType}/component.hbs`,
  userFile: (projectType) => `../template/${projectType}/userFile.hbs`,
  eachHelper: (projectType) => `../template/${projectType}/_eachHelper.hbs`,
  userPage: (projectType) => `../template/${projectType}/userPage.hbs`,
  onRowCreate: (projectType) => `../template/${projectType}/_onRowCreate.hbs`,
  gridViewBody: (projectType) => `../template/${projectType}/_gridViewBody.hbs`,
  bottomTabbarRouter: (projectType) => `../template/${projectType}/_bottomTabbarRouter.hbs`,
  idXml: () => `../template/idXml.hbs`
};

let __template = {};
let __compiler = {};

const COMPILER_OPTIONS = {
  noEscape: true
};

module.exports = function compile(templateName) {
  return (data) => {
    const compiler = Handlebars.compile(__template[templateName], COMPILER_OPTIONS);
    try {
        if(data.name === '')
            return;
        return prettier.format(compiler(data), getFormatterSettings());
        
    } catch (error) {
        console.log("Error on compile : ", error.message, templateName, data);
    }
  };
};

module.exports.getIdXmlCompiler = () => {
    return Handlebars.compile(readModuleFile(src.idXml()), COMPILER_OPTIONS);
}

module.exports.init = () => {
    const projectType = getProjectType();
    __template = {
        header: readModuleFile(src.header(projectType)),
        body: readModuleFile(src.body(projectType)),
        footer: readModuleFile(src.footer(projectType)),
        onLoad: readModuleFile(src.onLoad(projectType)),
        page: readModuleFile(src.page(projectType)),
        repeatboxExampleData: readModuleFile(src.repeatboxExampleData(projectType)),
        require: readModuleFile(src.require(projectType)),
        font: readModuleFile(src.font(projectType)),
        component: readModuleFile(src.component(projectType)),
        userFile: readModuleFile(src.userFile(projectType)),
        eachHelper: readModuleFile(src.eachHelper(projectType)),
        userPage: readModuleFile(src.userPage(projectType)),
        onRowCreate: readModuleFile(src.onRowCreate(projectType)),
        gridViewBody: readModuleFile(src.gridViewBody(projectType)),
        bottomTabbarRouter: readModuleFile(src.bottomTabbarRouter(projectType)),

    };
    __compiler = {
        repeatboxExampleData: Handlebars.compile(__template.repeatboxExampleData, COMPILER_OPTIONS),
        require: Handlebars.compile(__template.require, COMPILER_OPTIONS),
        font: Handlebars.compile(__template.font, COMPILER_OPTIONS)
    };
    const helper = require(`./templateHelpers/${getProjectType()}`)(__compiler);
    // Register partials
    Handlebars.registerPartial(__template);
    // Register Helpers
    Handlebars.registerHelper(helper);
    //Register require helper.
    Handlebars.registerHelper('require', function requireHelper(components, footer, isComponent) {
        const rqrdMdl = helper.getRequiredModules(components, footer, isComponent);
        return __compiler.require({
            modules: rqrdMdl.filter(type => !isComponent ? type != "View" : true)
        });
    });
    module.exports.helper = helper;
};
