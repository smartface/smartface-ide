const path = require('path');

const util = require('../../util');
const { getPath } = require('../../config');

const REPEATED_VIEW = {
  ListView: 'ListViewItem',
  GridView: 'GridViewItem'
};

const ENUMS = {
  imageAlign: 'Alignment',
  imageFillType: 'ImageFillType',
  textAlignment: 'TextAlignment',
  positionBackroundImage: 'Alignment',
  imagePosition: 'Alignment',
  returnKeyType: 'TextBoxReturnKey',
  textFormatType: 'TextBoxTextFormat',
  groupStyle: 'RepeatBoxGroupStyle',
  alignment: 'LayoutAlignment',
  layoutType: 'LayoutType',
  orientation: 'Page.Orientation',
  controlStyle: 'VideoControlStyle',
  movieScalingMode: 'MovieScalingMode',
  decelerationRate: 'ScrollViewDecelerationRate',
  type: 'MapView.Type',
  gradientOrientation: 'Color/GradientOrientation',
  lineRotationAngle: 'LineRotationAngle',
  style: 'StatusBarStyle',
  adSize: 'Android.AdMob.AdSize',
  searchViewStyle: 'SearchView.iOS.Style',
  alignSelf: 'FlexLayout.AlignSelf',
  alignContent: 'FlexLayout.AlignContent',
  alignItems: 'FlexLayout.AlignItems',
  direction: 'FlexLayout.Direction',
  flexDirection: 'FlexLayout.FlexDirection',
  flexWrap: 'FlexLayout.FlexWrap',
  justifyContent: 'FlexLayout.JustifyContent',
  positionType: 'FlexLayout.PositionType',
  overflow: 'FlexLayout.Overflow',
  align: 'ScrollViewAlign',
  scrollDirection: 'LayoutManager.ScrollDirection'
};

const MAP_PROPS = ['type'];

const FLEX_PROPS = [
  'alignSelf',
  'alignContent',
  'alignItems',
  'direction',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'positionType'
];

const COLOR_PROP = [
  'color',
  'backgroundColor',
  'textColor',
  'borderColor',
  'titleColor',
  'thumbOffColor',
  'thumbOnColor',
  'toggleOffColor',
  'toggleOnColor',
  'hintTextColor',
  'minTrackColor',
  'maxTrackColor',
  'thumbColor'
];

const IMAGE_PROP = [
  'backgroundImage',
  'thumbImage',
  'inactiveImage',
  'maxTrackImage',
  'minTrackImage',
  'backIndicatorImage'
];

const TEXT_PROPS = ['htmlText', 'text', 'title', 'subtitle', 'hint', 'placeHolder'];

const RAW_PROPS = ['onItemLength', 'layoutManager'];

const IGNORE_PROPS = ['name'];

function isValidProp(key) {
  return IGNORE_PROPS.indexOf(key) === -1;
}

function getString(_compiler) {
  return function(key, value, type) {
    const enumKey = ENUMS[key];
    const valueType = typeof value;
    let res = '';
    if (TEXT_PROPS.some(k => k === key) && valueType !== 'string') {
      // console.log("Text  Value : _> ", value, ": valueType:> ",valueType);
      return '""';
    }
    if (key === 'flexGrow' && isNaN(value)) return '0';
    if (value === null) return 'NaN';
    if (type && enumKey) {
      res = `${type}.${value}`;
    } else if (enumKey) {
      res = `${enumKey}.${value}`;
    } else if (COLOR_PROP.indexOf(key) !== -1) {
      res = createColorForDevice(value);
    } else if (IMAGE_PROP.indexOf(key) !== -1) {
      res = `Image.createFromFile("images://${value}")`;
    } else if (key === 'font') {
      res = _compiler.font({
        font: value
      });
    } else if (RAW_PROPS.indexOf(key) !== -1) {
      res = value;
    } else {
      res = json(value);
    }
    return res;
  };
}

function createColorForDevice(color) {
  let res = 'Color.create(';
  if (/rgb/i.test(color)) {
    const rgba = color.match(/\d\.\d+|\d+/gi);
    res += `${(Number(rgba[3]) * 255).toFixed(0)}, ${rgba[0]}, ${rgba[1]}, ${rgba[2]}`;
  } else {
    res += `"${color}"`;
  }
  res += ')';
  return res;
}

function json(context) {
  if (typeof context === 'object') {
    return 'null';
  }
  return JSON.stringify(context);
}

function toLowerCase(str) {
  return str.toLowerCase();
}

function getRequiredModules(_components, footer, isComponent) {
  const res = [];
  const requiredModules = {};

  const components = _components.smfObjects
    ? [_components].concat(_components.smfObjects)
    : _components instanceof Array
    ? _components
    : [_components];

  function searchAndSet(_comps) {
    _comps.forEach(item => {
      (!item.libraryType || isComponent) && (requiredModules[item.type] = true);
      if (REPEATED_VIEW[item.type] && !(item.children && item.children.length !== 0)) {
        requiredModules[REPEATED_VIEW[item.type]] = true;
      }
      item.type === 'ShimmerFlexLayout' && (requiredModules.FlexLayout = true);
      if (item.smfObjects && ((!item.isLibraryComponent && !isComponent) || isComponent)) {
        searchAndSet(item.smfObjects);
      }
    });
  }

  searchAndSet(components);

  for (const mdl in requiredModules) {
    res.push(mdl);
  }

  return res;
}

function capitalizeFirstLetter(data) {
  return util.capitalizeFirstLetter(data);
}

function getStatusBarProp(key, value) {
  let res = '';

  switch (key) {
    case 'color':
      res = `this.statusBar.android && (this.statusBar.android.color = ${createColorForDevice(
        value
      )});`;
      break;
    case 'style':
      res = `this.statusBar.ios && (this.statusBar.ios.style = StatusBarStyle.${value});`;
      break;
    default:
      res = `this.statusBar.${key} = ${getString(key, value)};`;
  }
  return res;
}

function math(lvalue, operator, rvalue, options) {
  lvalue = parseFloat(lvalue);
  rvalue = parseFloat(rvalue);

  return {
    '+': lvalue + rvalue,
    '-': lvalue - rvalue,
    '*': lvalue * rvalue,
    '/': lvalue / rvalue,
    '%': lvalue % rvalue
  }[operator];
}

const FONT_STYLE = {
  BOLD: 'BOLD',
  ITALIC: 'ITALIC',
  NORMAL: 'NORMAL',
  DEFAULT: 'NORMAL'
};

function getFontFamily(family) {
  if (!family || family === 'Default') {
    return 'Font.DEFAULT';
  }

  return `"${family}"`;
}

function getFontStyle(font) {
  let res = '';
  if (font.bold) {
    res += FONT_STYLE.BOLD;
  }
  if (font.italic) {
    res && (res += '_');
    res += FONT_STYLE.ITALIC;
  }
  !res && (res = FONT_STYLE.DEFAULT);
  return res;
}

const IRREGULAR_ENUMS = {
  require: {},
  import: {
    propFactory: '@smartface/styling-context/lib/sfCorePropFactory',
    actionAddChild: '@smartface/styling-context/lib/action/addChild',
    ScrollViewAlign: {
      path: '@smartface/native/ui/scrollview/scrollview',
      importDefault: false
    },
    AttributedString: '@smartface/native/ui/attributedstring',
    LayoutManager: '@smartface/native/ui/layoutmanager',
    createAttributedStrings: '@smartface/html-to-text'
  }
};

const WITH_EXTEND = {
  StaggeredFlowLayout: true
};

function getRequiredIrregularEnums(smfObjects) {
  const mdls = {};
  const res = [];

  if (arguments[1]) smfObjects = [arguments[1].data.root].concat(smfObjects || []);
  if (!smfObjects) return '';

  function searchAndSet(_smfObjects) {
    _smfObjects.forEach(item => {
      item.attributes && item.attributes.align && (mdls.ScrollViewAlign = true);
      item.html && (mdls.propFactory = true);
      item.html && (mdls.AttributedString = true);
      item.html && (mdls.createAttributedStrings = true);
      item.type === 'GridView' && (mdls.LayoutManager = true);
      REPEATED_VIEW[item.type] && (mdls.actionAddChild = true);
      item.smfObjects && searchAndSet(item.smfObjects);
    });
  }

  searchAndSet(smfObjects);

  for (const mdl in mdls) {
    res.push(
      `const ${mdl} = ${WITH_EXTEND[mdl] ? 'extend(' : ''}require("${IRREGULAR_ENUMS[mdl]}")${
        WITH_EXTEND[mdl] ? ')' : ''
      };`
    );
  }
  return res.join('\n');
}

function getNewLine() {
  return '\n';
}

function isEmpty(val, options) {
  const type = typeof val;
  if (type === 'object') {
    if (val && Object.keys(val).length > 0) return options.inverse(this);
  } else if ( !val || Number(val.length) === 0) {
    return options.fn(this);
  } else if (val) {
    return options.inverse(this);
  }
  return options.fn(this);
}

function isValidObject(val, options) {
  const type = typeof val;
  if (type === 'object' && val !== null && Object.keys(val).length > 0) {
    return options.fn(this);
  }
  return options.inverse(this);
}

function isValidArray(val, options) {
  if (val instanceof Array && ['number', 'string'].includes(typeof val[0])) {
    return options.fn(this);
  }
  return options.inverse(this);
}

function isEqual(left, right, options) {
  if (left === right) {
    return options.fn(this);
  }

  return options.inverse(this);
}

function isRepeatedView(type, options) {
  if (REPEATED_VIEW[type]) return options.fn(this);
  return options.inverse(this);
}

function writeTab(tabCount) {
  const count = tabCount || 3;
  return '\t'.repeat(count);
}

function test(test1, test2, test3) {
  test1;
}

function isNotNull(value, options) {
  if (value === null) {
    return options.inverse(this);
  }

  return options.fn(this);
}

function isNull(value, options) {
  if (value !== null) {
    return options.inverse(this);
  }

  return options.fn(this);
}

function needsWriteObjectData(footer, libraryType, isLibComp, options) {
  if ((footer || isLibComp) && libraryType) {
    return options.inverse(this);
  }

  return options.fn(this);
}

function getAdditionalData(obj) {
  let res = '';
  // console.log(obj.type);
  if (obj.type === 'ListView' && !(obj.children && obj.children.length !== 0)) {
    res = `\n\t\t${obj.varName}.onRowCreate = function(){ return new ListViewItem(); };`;
  } else if (obj.type === 'Switch') {
    res = `\n\t\tif(${obj.varName}Style.toggleOffColor)\n\t\t\t${obj.varName}.android && (${obj.varName}.android.toggleOffColor = ${obj.varName}Style.toggleOffColor);`;
  } else if (obj.type === 'SearchView') {
    res = `\n\t\tif(${obj.varName}Style.searchViewStyle)\n\t\t\t${obj.varName}.ios && (${obj.varName}.ios.searchViewStyle = ${obj.varName}Style.searchViewStyle);`;
    res += `\n\t\tif(${obj.varName}Style.textAlignment)\n\t\t\t${obj.varName}.android && (${obj.varName}.android.textAlignment = ${obj.varName}Style.textAlignment);`;
  } else if (obj.type === 'Label') {
    res = `\n\t\tif(${obj.varName}Style.scrollEnabled === false)\n\t\t\t${obj.varName}.ios && (${obj.varName}.ios.scrollEnabled = false);`;
  } else if (obj.type === 'TextArea') {
    res = `\n\t\tif(${obj.varName}Style.showScrollBar === false || ${obj.varName}Style.showScrollBar === true )\n\t\t\t${obj.varName}.ios && (${obj.varName}.ios.showScrollBar = ${obj.varName}Style.showScrollBar );`;
    res += `\n\t\tif(${obj.varName}Style.hint)\n\t\t\t${obj.varName}.android && (${obj.varName}.android.hint = ${obj.varName}Style.hint);`;
    res += `\n\t\tif(${obj.varName}Style.hintTextColor)\n\t\t\t${obj.varName}.android && (${obj.varName}.android.hintTextColor = ${obj.varName}Style.hintTextColor);`;
    res += `\n\t\tif(${obj.varName}Style.keyboardAppearance)\n\t\t\t${obj.varName}.ios && (${obj.varName}.ios.keyboardAppearance = ${obj.varName}Style.keyboardAppearance);`;
  } else if (obj.type === 'TextBox') {
    res = `\n\t\tif(${obj.varName}Style.hintTextColor)\n\t\t\t${obj.varName}.android && (${obj.varName}.android.hintTextColor = ${obj.varName}Style.hintTextColor);`;
    res += `\n\t\tif(${obj.varName}Style.elevation)\n\t\t\t${obj.varName}.android && (${obj.varName}.android.elevation = ${obj.varName}Style.elevation);`;
    res += `\n\t\tif(${obj.varName}Style.keyboardAppearance)\n\t\t\t${obj.varName}.ios && (${obj.varName}.ios.keyboardAppearance = ${obj.varName}Style.keyboardAppearance);`;
    res += `\n\t\tif(${obj.varName}Style.clearButtonEnabled)\n\t\t\t${obj.varName}.ios && (${obj.varName}.ios.clearButtonEnabled = ${obj.varName}Style.clearButtonEnabled);`;
    res += `\n\t\tif(${obj.varName}Style.minimumFontSize)\n\t\t\t${obj.varName}.ios && (${obj.varName}.ios.minimumFontSize = ${obj.varName}Style.minimumFontSize);`;
    res += `\n\t\tif(${obj.varName}Style.adjustFontSizeToFit)\n\t\t\t${obj.varName}.ios && (${obj.varName}.ios.adjustFontSizeToFit = ${obj.varName}Style.adjustFontSizeToFit);`;
  } else if (obj.type === 'ScrollView') {
  }
  return res;
}

module.exports = {
  getHelpers(_compiler) {
    return {
      isValidArray,
      getStatusBarProp,
      capitalizeFirstLetter,
      getRequiredModules,
      toLowerCase,
      json,
      getString: getString(_compiler),
      isValidProp,
      getFontStyle,
      getFontFamily,
      math,
      getNewLine,
      isEqual,
      isRepeatedView,
      writeTab,
      isEmpty,
      isValidObject,
      test,
      isNotNull,
      isNull,
      needsWriteObjectData,
      getAdditionalData
    };
  },
  ENUMS,
  IRREGULAR_ENUMS,
  FLEX_PROPS,
  COLOR_PROP,
  REPEATED_VIEW,
  MAP_PROPS,
  IMAGE_PROP,
  RAW_PROPS,
  TEXT_PROPS,
  IGNORE_PROPS,
  WITH_EXTEND
};
