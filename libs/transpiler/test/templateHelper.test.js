const assert = require("chai").assert;
const purgeCache = require("./util").purgeCache;
const pgxData = require("./pgx.json");
const parser = require("../src/smfObject/pgxParser");

const fs = require("fs");

//Fake option class.
function Options(){
  this.result = false;
  this.inverse = e => this.result = false;
  this.fn = e => this.result = true;
  this.getResult  = e => this.result;
};

describe("templateHelper", function() {
  var templateHelper, objectData;

  beforeEach(() => {
    purgeCache("../src/core/templateHelper");
    templateHelper = require("../src/core/templateEngine").helper;
    objectData = parser(pgxData);
  });

  //@deprecated
  describe(".getStatusBarProp(key)", () => {
    //T
    beforeEach(() => {

    });

  });

  describe(".capitalizeFirstLetter(data)", () => {
    it("should capitalize first character of given data", () => {
      assert.equal(templateHelper.capitalizeFirstLetter("flexlayout"), "Flexlayout");
      assert.equal(templateHelper.capitalizeFirstLetter("flexLayout"), "FlexLayout");
    });
  });

  describe(".getRequiredModules(_components, footer, isComponent)", () => {

    it("should return array of required modules", () => {
      var res = templateHelper.getRequiredModules(objectData.smfObjects, objectData.footer, false);
      assert.deepEqual(res, ['Button', 'FlexLayout', 'ListView', 'ListViewItem']);
    });
  });

  describe(".toLowerCase(str)", () => {
    it("should return lowercased of given data", () => {
      assert.equal(templateHelper.toLowerCase("flexlayout"), "flexlayout");
      assert.equal(templateHelper.toLowerCase("flexLayoUt"), "flexlayout");
    });
  });

  describe(".json(str)", () => {
    it("should return json.sytringfied string", () => {
      assert.equal(templateHelper.json(null), "null");
      assert.equal(templateHelper.json({}), "null");
      assert.equal(templateHelper.json("flexLayoUt"), '"flexLayoUt"');
    });
  });

  describe(".getString(key, value, type)", () => {
    it("If value is null, it should return 'NaN' ", () => {
      assert.equal(templateHelper.getString("height", null), "NaN");
    });
    it("If key is 'flexGrow' and value is NaN, it should return '0' ", () => {
      assert.equal(templateHelper.getString("flexGrow", "as"), 0);
    });
    it("If key is one of enumarition props, it should return 'enumKey.value' or  if type parameter is defined, it should  return 'type.value' ", () => {
      assert.equal(templateHelper.getString("alignSelf", "CENTER"), 'FlexLayout.AlignSelf.CENTER');
      assert.equal(templateHelper.getString("alignSelf", "CENTER", "FlexLayout"), 'FlexLayout.CENTER');
    });
    it("If key is one of color props, it should return 'Color.create(...)' ", () => {
      assert.equal(templateHelper.getString("color", "#FDFDAA"), 'Color.create("#FDFDAA")');
      assert.equal(templateHelper.getString("color", "rgba(255,254,200,1)"), 'Color.create(255, 255, 254, 200)');
    });
    it("If key is one of image_props, it should return 'Image.createFromFile(images://...)' ", () => {
      assert.equal(templateHelper.getString("image", "a.png", "ImageView"), 'Image.createFromFile("images://a.png")');
    });
    it("If key is font, it should return 'Font.create(...)' ", () => {
      assert.equal(templateHelper.getString("font", {
        family: "Arial",
        size: 14
      }), 'Font.create("Arial", 14, Font.NORMAL)\n');
      assert.equal(templateHelper.getString("font", {
        size: 14,
        bold: true,
        italic: true
      }), 'Font.create(Font.DEFAULT, 14, Font.BOLD_ITALIC)\n');
    });
    it("If keys is standart, it should return json.stringified string", () => {
      assert.equal(templateHelper.getString("text", "a\n\tsmartface\ntranspiler"), '"a\\n\\tsmartface\\ntranspiler"');
    });
  });

  describe(".isValidProp(key)", () => {
    it("should return prop is valid or not", () => {
      assert.equal(templateHelper.isValidProp("name"), false);
      assert.equal(templateHelper.isValidProp("flexGrow"), true);
    });
  });

  describe(".getFontStyle(font)", () => {
    it("should return font style (NORMAL, BOLD, ITALIC, BOLD_ITALIC)", () => {
      assert.equal(templateHelper.getFontStyle({}), "NORMAL");
      assert.equal(templateHelper.getFontStyle({ bold: true }), "BOLD");
      assert.equal(templateHelper.getFontStyle({ bold: true, italic: true }), "BOLD_ITALIC");
    });
  });

  describe(".getFontFamily(family)", () => {
    it("should return font family (Font.DEFAULT, 'family')", () => {
      assert.equal(templateHelper.getFontFamily(), "Font.DEFAULT");
      assert.equal(templateHelper.getFontFamily("Arial"), '"Arial"');
    });
  });
  
  describe(".math(lvalue, operator, rvalue, options)", () => {
    it("should do math operations (+, -, /, %, *)", () => {
      assert.equal(templateHelper.math(3 , "+", 5), 8);
      assert.equal(templateHelper.math(5 , "%", 3), 2);
    });
  });
  
  describe(".getRequiredLibModules(smfObjects, isLib)", () => {
    it("should return string of required modules", () => {
      var res = templateHelper.getRequiredLibModules(objectData.smfObjects, false);
      assert.equal(res, "");
    });
  });
  
  describe(".getNewLine()", () => {
    it("should return newline", () => {
      assert.equal(templateHelper.getNewLine(), "\n");
    });
  });
  
  describe(".isEqual(left, right, options)", () => {
    var options = new Options();
    it("should return result of equality", () => {
      templateHelper.isEqual("transpiler","transpiler", options);
      assert.equal(options.getResult(), true);
      templateHelper.isEqual("transpiler","transpiler2", options);
      assert.equal(options.getResult(), false);
    });
  });
  
  describe(".isEmpty(val, options)", () => {
    var options = new Options();
    it("should check given value is empty", () => {
      templateHelper.isEmpty("transpiler", options);
      assert.equal(options.getResult(), false);
      templateHelper.isEmpty({}, options);
      assert.equal(options.getResult(), true);
      templateHelper.isEmpty(null, options);
      assert.equal(options.getResult(), true);
    });
  });
  
  describe(".writeTab(tabCount)", () => {
    it("should return tabs", () => {
      assert.equal(templateHelper.writeTab(5), "\t\t\t\t\t");
    });
  });

});
