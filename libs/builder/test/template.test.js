const assert = require("chai").assert;
const purgeCache = require("./util").purgeCache;
const pgxData = require("./pgx.json");
const parser = require("../src/smfObject/pgxParser");

const fs = require("fs");

const RES = {
  header: `//------------------------------------------------------------------------------\n//\n//     This code was auto generated.\n//\n//     Manual changes to this file may cause unexpected behavior in your application.\n//     Manual changes to this file will be overwritten if the code is regenerated.\n//\n//------------------------------------------------------------------------------\n\nconst extend = require(\'js-base/core/extend\');`,
  body: 'function $Button1(_super, pageInstance) {\n  _super(this, {\n    text: "button"\n  });\n}\n$Button1.$$styleContext = {\n  classNames: ".button",\n  userProps: {\n    font: {\n      size: 24\n    }\n  }\n};\nconst $Button1_ = Button($Button1);\n\nfunction $Button1_1_1(_super, pageInstance) {\n  _super(this, {\n    text: "Button"\n  });\n}\n$Button1_1_1.$$styleContext = {\n  classNames: ".button",\n  userProps: {\n    left: 0,\n    top: 0,\n    font: {\n      size: 50,\n      family: "Default"\n    }\n  }\n};\nconst $Button1_1_1_ = Button($Button1_1_1);\n\nfunction $LookbookItem(_super, pageInstance) {\n  _super(this);\n}\n$LookbookItem.$$styleContext = {\n  classNames: ".flexLayout .flexLayout-default",\n  userProps: {\n    top: 0,\n    width: 367.6923076923077,\n    height: 250.76923076923077,\n    backgroundColor: "rgba( 231, 143, 143, 0.64 )",\n    flexProps: {\n      justifyContent: "CENTER",\n      alignItems: "CENTER",\n      positionType: "RELATIVE"\n    }\n  }\n};\nconst $LookbookItem_ = FlexLayout($LookbookItem);\n\nfunction $ListView1(_super, pageInstance) {\n  _super(this);\n  this.onRowCreate = function() {\n    return new $ListView1$$FlShoppingBagItem_();\n  };\n}\n$ListView1.$$styleContext = {\n  classNames: ".listView",\n  userProps: {\n    width: 346.15384615384613,\n    height: 201.53846153846152\n  }\n};\nconst $ListView1_ = ListView($ListView1);\n\nfunction $ListView1$$FlShoppingBagItem(_super, pageInstance) {\n  _super(this);\n}\n$ListView1$$FlShoppingBagItem.$$styleContext = {\n  classNames: ".listViewItem",\n  userProps: {\n    left: 0,\n    top: 0,\n    width: null,\n    height: 60,\n    marginRight: null,\n    right: null,\n    flexProps: {\n      flexDirection: "ROW",\n      justifyContent: "CENTER",\n      positionType: "RELATIVE"\n    }\n  }\n};\nconst $ListView1$$FlShoppingBagItem_ = ListViewItem($ListView1$$FlShoppingBagItem);',
  footer: '/**\n * @event onShow\n * This event is called when a page appears on the screen (everytime).\n * @param {Object} parameters passed from Router.go function\n */\nfunction onShow() {\n  //HeaderBar props\n  this.headerBar.title = "newPage001";\n\n}',
  page: '//------------------------------------------------------------------------------\n//\n//     This code was auto generated.\n//\n//     Manual changes to this file may cause unexpected behavior in your application.\n//     Manual changes to this file will be overwritten if the code is regenerated.\n//\n//------------------------------------------------------------------------------\n\nconst extend = require(\'js-base/core/extend\');\nconst PageBase = require(\'@smartface/native/ui/page\');\nconst Page = extend(PageBase);\nconst pageContextPatch = require(\'@smartface/contx/lib/smartface/pageContextPatch\');\nconst Button = extend(require(\'@smartface/native/ui/button\'));\nconst FlexLayout = extend(require(\'@smartface/native/ui/flexlayout\'));\nconst ListView = extend(require(\'@smartface/native/ui/listview\'));\nconst ListViewItem = extend(require(\'@smartface/native/ui/listviewitem\'));\n\nfunction addChild(childName, ChildClass, pageInstance) {\n  this.children = this.children || {};\n  this.children[childName] = new ChildClass(pageInstance);\n  if (this.layout)\n    this.layout.addChild(this.children[childName]);\n  else\n    this.addChild(this.children[childName]);\n}\n//constructor\nfunction $NewPage001(_super, props) {\n  // initalizes super class for this page scope\n  _super(this, Object.assign({}, {\n    onShow: onShow.bind(this)\n  }, props || {}));\n  this.children = {};\n  this.children["statusBar"] = this.statusBar;\n  this.children["headerBar"] = this.headerBar;\n  addChild.call(this, "button1", $Button1_, this);\n  addChild.call(this, "button1_1_1", $Button1_1_1_, this);\n  addChild.call(this, "LookbookItem", $LookbookItem_, this);\n  addChild.call(this, "listView1", $ListView1_, this);\n  pageContextPatch(this, "newPage001");\n}\n$NewPage001.$$styleContext = {\n  classNames: ".page",\n  userProps: {},\n  statusBar: {\n    classNames: ".statusBar",\n    userProps: {}\n  },\n  headerBar: {\n    classNames: ".headerBar",\n    userProps: {}\n  }\n};\nconst $NewPage001_ = Page($NewPage001);\n\nfunction $Button1(_super, pageInstance) {\n  _super(this, {\n    text: "button"\n  });\n}\n$Button1.$$styleContext = {\n  classNames: ".button",\n  userProps: {\n    font: {\n      size: 24\n    }\n  }\n};\nconst $Button1_ = Button($Button1);\n\nfunction $Button1_1_1(_super, pageInstance) {\n  _super(this, {\n    text: "Button"\n  });\n}\n$Button1_1_1.$$styleContext = {\n  classNames: ".button",\n  userProps: {\n    left: 0,\n    top: 0,\n    font: {\n      size: 50,\n      family: "Default"\n    }\n  }\n};\nconst $Button1_1_1_ = Button($Button1_1_1);\n\nfunction $LookbookItem(_super, pageInstance) {\n  _super(this);\n}\n$LookbookItem.$$styleContext = {\n  classNames: ".flexLayout .flexLayout-default",\n  userProps: {\n    top: 0,\n    width: 367.6923076923077,\n    height: 250.76923076923077,\n    backgroundColor: "rgba( 231, 143, 143, 0.64 )",\n    flexProps: {\n      justifyContent: "CENTER",\n      alignItems: "CENTER",\n      positionType: "RELATIVE"\n    }\n  }\n};\nconst $LookbookItem_ = FlexLayout($LookbookItem);\n\nfunction $ListView1(_super, pageInstance) {\n  _super(this);\n  this.onRowCreate = function() {\n    return new $ListView1$$FlShoppingBagItem_();\n  };\n}\n$ListView1.$$styleContext = {\n  classNames: ".listView",\n  userProps: {\n    width: 346.15384615384613,\n    height: 201.53846153846152\n  }\n};\nconst $ListView1_ = ListView($ListView1);\n\nfunction $ListView1$$FlShoppingBagItem(_super, pageInstance) {\n  _super(this);\n}\n$ListView1$$FlShoppingBagItem.$$styleContext = {\n  classNames: ".listViewItem",\n  userProps: {\n    left: 0,\n    top: 0,\n    width: null,\n    height: 60,\n    marginRight: null,\n    right: null,\n    flexProps: {\n      flexDirection: "ROW",\n      justifyContent: "CENTER",\n      positionType: "RELATIVE"\n    }\n  }\n};\nconst $ListView1$$FlShoppingBagItem_ = ListViewItem($ListView1$$FlShoppingBagItem);\n\n/**\n * @event onShow\n * This event is called when a page appears on the screen (everytime).\n * @param {Object} parameters passed from Router.go function\n */\nfunction onShow() {\n  //HeaderBar props\n  this.headerBar.title = "newPage001";\n\n}\n\nmodule && (module.exports = $NewPage001_);',
  eachHelper: '{\n  bottom: 0,\n  height: 60.3,\n  image: "smartface.png",\n  imageFillType: "ASPECTFIT",\n  borderColor: "rgba( 255, 255, 255, 1 )",\n  borderWidth: 0,\n  borderRadius: 0,\n  visible: true\n}'
};

const props = {
  bottom: 0,
  height: 60.3,
  image: "smartface.png",
  imageFillType: "ASPECTFIT",
  borderColor: "rgba( 255, 255, 255, 1 )",
  borderWidth: 0,
  borderRadius: 0,
  visible: true
};

describe("templates", function() {
  var templateEngine, objectData;

  beforeEach(() => {
    purgeCache("../src/core/templateEngine");
    templateEngine = require("../src/core/templateEngine");
    objectData = parser(pgxData);
  });

  it("should render header template", () => {
    var res = templateEngine("header");
    res = res(objectData);
    assert.equal(res, RES.header);
  });

  it("should render body template", () => {
    var res = templateEngine("body");
    res = res(objectData);
    assert.equal(res, RES.body);
  });

  it("should render footer template", () => {
    var res = templateEngine("footer");
    res = res(objectData.footer);
    assert.equal(res, RES.footer);
  });

  it("should render page template", () => {
    var res = templateEngine("page");
    res = res(objectData);
    assert.equal(res, RES.page);
  });

  it("should render eachHelper template", () => {
    var res = templateEngine("eachHelper");
    res = res({ props: props });
    assert.equal(res, RES.eachHelper);
  });

});
