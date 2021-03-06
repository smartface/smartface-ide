const dot = require("dot-object");
const dotProp = require("dot-prop");
const createAttributedStrings = require("@smartface/html-to-text");
const isPlainAttributedText = require("@smartface/html-to-text/util").isPlainAttributedText;
const { updateIdXmlContent } = require('../prepare-id-xml');
const Mapper = require("./mapToSmartfaceObject");
const mapper = new Mapper();

const util = require("../util");
const { DEFAULT_PATHS, getProjectType, PROJECT_TYPES } = require("../config");
const LIBRARY_PAGE_NAME = DEFAULT_PATHS.LIBRARY_PAGE_NAME;
const MODULES_PAGE_NAME = DEFAULT_PATHS.MODULES_PAGE_NAME;
const getFamilyTree = util.getFamilyTree;
const globalLibComps = require("../smfObject/libComps");
const COMPONENT_BASED_PROP_MAP = require("../../defaultMap.json").componentBasedPropMap;

const ATTRIBUTES = require("./attributes");

const REPEATED_VIEW_ITEM_MAP = {
  "ListView": "ListViewItem",
  "GridView": "GridViewItem"
};

const STATIC_COMPONENTS = {
  "StatusBar": "statusBar",
  "HeaderBar": "headerBar",
  "Page": "page"
};

const POSITION_PROP = [
  "width",
  "height",
  "left",
  "top",
  "right",
  "bottom"
];

const positionRegex = /width|height|left|top|right|bottom/ig;

function parsePgx(components) {
  let componentById = {},
    idNameObjects = {},
    smfObjects = [],
    footer = {},
    childrenOfPage = [],
    compsObject = {};

  util.sortComponents(components);
  components = extendComponetsFoShimmerFlexlayouts(components);
  components.forEach(comp => {
    componentById[comp.id] = comp;
    idNameObjects[comp.id] = comp.props.name;
  });
  var isLibraryPage = components[0].props.name === LIBRARY_PAGE_NAME;
  !isLibraryPage && handleInvalidLibraryComponents(components);
  components.forEach(component => {
    if (component.degree === 0 && component.type !== "Page") {
      return; // skip orphan component
    }
    var item = parseComponent(component, componentById[component.props.parent]);
    var treeArr = getFamilyTree(componentById, component);
    component.type === "GridView" && (item.layoutManager.onItemLength = `() => ${getAppropriateItemLength(component, componentById)}`);
    item.bundleID = "#" + treeArr.reverse().join("_");

    if (component.type !== "Page" && component.type !== "StatusBar" && component.type !== "HeaderBar") {
      item.testId = "_" + treeArr.map(name => util.capitalizeFirstLetter(name)).join("_");
      updateIdXmlContent(item.testId);
      if (component.source && component.source.type && component.source.type.toLowerCase() === "materialtextbox") {
        updateIdXmlContent(item.testId + '_textBox');
        delete item.props.testId;
        item.mtbTestId = item.testId;
      } else {
        item.props.testId = item.testId;
      }
    }

    treeArr.length > 1 && treeArr.shift(); // remove pageName
    item.varName = "$" + treeArr.map(name => util.capitalizeFirstLetter(name)).join("$$");
    item.parentID = item.parent;
    item.initialized = component.initialized;
    item.parent && (item.parent = idNameObjects[item.parent]);
    item.children && (item.children = item.children.map(child => {
      if (!idNameObjects[child])
        throw new Error(`No component with (${child}) id. Check '${components[0].props.name}.pgx' file!`);
      return {
        name: idNameObjects[child],
        constructorName: item.varName + "$$" + util.capitalizeFirstLetter(idNameObjects[child])
      };
    }));
    item.parentType = getType(item.parent, components);
    var headerItem = STATIC_COMPONENTS[item.type];
    compsObject[item.id] = item;
    if (STATIC_COMPONENTS[item.type]) {
      footer[headerItem] = item;
    }
    else {
      if (footer["page"] && item.parentID == footer["page"].id) {
        smfObjects.push(item);
        childrenOfPage.push({
          name: item.name,
          constructorName: item.varName
        });
      }
      else {
        var parentItem = compsObject[item.parentID];
        if (parentItem) {
          parentItem.smfObjects = parentItem.smfObjects || [];
          parentItem.smfObjects.push(item);
        }
      }
    }
    item.className = component.className || "";
    item.defaultClassNames = `${STATIC_COMPONENTS[item.type] ? "" : ".default_common"} .default_${util.lowercaseFirstLetter(item.type)}`;
    //(!isLibraryPage && (item.type === "ListViewItem")) && (item.className += ` ${item.bundleID}`);
    //isLibraryPage && (item.className += " #" + getFamilyTree(componentById, component).reverse().join("_"));
  });
  footer.mapviewRefs = prepareMapviewRefs(componentById, components);
  footer.pageName = footer.page ? footer.page.varName : '';
  if(footer.page)
      footer.page.safeAreaEnabled = !!components[0].userProps.safeAreaEnabled;
  var _smfObjects = footer.pageName === LIBRARY_PAGE_NAME ? smfObjects :
    smfObjects.filter(comp => !checkParentIsLibraryComp(comp, compsObject));
  setLibComponentsTypes(smfObjects);
  if (isLibraryPage) {
    prepareAndSetComponentsAssignedToRoot(smfObjects, componentById);
  }
  //_smfObjects.reverse();
  return Object.assign({}, {
    initialized: components[0].initialized,
    name: footer.page ? footer.page.name : '',
    pageName: footer.pageName,
    smfObjects: _smfObjects,
    footer: footer,
    children: childrenOfPage,
    componentsAssignedToPage: prepareComponentsAssignedToPage(smfObjects, componentById)
  });
}

function parseComponent(obj, parentComponent) {
  const COMP_PROP_MAP = COMPONENT_BASED_PROP_MAP[obj.type];
  var smfObject = dot.dot(obj),
    parsedSmfObject = {
      props: {},
      attributes: {},
      font: {},
      children: obj.props.children && obj.props.children.length ? obj.props.children : null,
      degree: obj.degree,
      id: obj.id,
      testId: ""
    };

  // if (obj && obj.userProps && obj.userProps.testId) {
  //     parsedSmfObject.testId = obj.userProps.testId;
  // }
  var keys = Object.keys(smfObject),
    type = obj.type;
  keys.forEach((prop) => {
    var smfKey = mapper.get(prop),
      value = smfObject[prop],
      tempName;

    if (prop === "props.name") {
      parsedSmfObject.name = value;
      parsedSmfObject.varName = value;
    }
    else if (prop === "props.parent") {
      parsedSmfObject.parent = value;
    }
    else if (smfKey === "orientation") {
      parsedSmfObject.orientation = value;
    }
    else if (smfKey === "usePageVariable") {
      value && (parsedSmfObject.usePageVariable = value);
    }
    else if (/userProps\.font|android|ios|layout\.*/.test(prop)) {
      tempName = prop.replace("userProps.", "");
      dotProp.set(parsedSmfObject.props, tempName, value);
    }
    else if (ATTRIBUTES.some(attribute => attribute === smfKey))
      parsedSmfObject.attributes[smfKey] = value;
    else if (typeof smfKey === "string") {
      if (!(POSITION_PROP.indexOf(smfKey) !== -1 && STATIC_COMPONENTS[type]) && checkPropIsValid(smfKey, smfObject)) {
        if (COMP_PROP_MAP && COMP_PROP_MAP[smfKey]) {
          dotProp.set(parsedSmfObject.props, COMP_PROP_MAP[smfKey], value);
        }
        else {
          tempName = prop.replace("userProps.", "");
          dotProp.set(parsedSmfObject.props, tempName, value);
        }
      }
    }
  });
  if (parsedSmfObject.props.ios && parsedSmfObject.props.ios.shadowOpacity) {
    parsedSmfObject.props.ios.masksToBounds = false;
  }
  if (parsedSmfObject.props.layout && parsedSmfObject.props.layout.ios &&
    parsedSmfObject.props.layout.ios.shadowOpacity) {
    parsedSmfObject.props.layout.ios.masksToBounds = false;
  }
  parsedSmfObject.type = smfObject.type;
  parsedSmfObject.id = obj.id;
  parsedSmfObject.usePageVariable = obj.props.usePageVariable;
  //parsedSmfObject.type !== "HeaderBar" && (parsedSmfObject.attributes.skipDefaults = true);
  if (type === "GridView") { // TODO itemLength from collectionViewItem
    parsedSmfObject.layoutManager = Object.assign(parsedSmfObject.props.layoutManager || {});
    delete parsedSmfObject.props.layoutManager;
    if (getProjectType() !== PROJECT_TYPES.ts) {
      parsedSmfObject.attributes.layoutManager = "layoutManager";
    }
  }
  else if (type === "TextView") {
    var isPlainText = true;
    createAttributedStrings(obj.userProps.html || "").forEach(t => {
      !isPlainAttributedText(t) && (isPlainText = false);
    });
    if (!isPlainText) {
      parsedSmfObject.html = obj.userProps.html ? obj.userProps.html : null;
      delete parsedSmfObject.props.font;
    }
  }
  else if (type === "ScrollView" &&
    parsedSmfObject.attributes.autoSizeEnabled &&
    parsedSmfObject.props.layout) {
    delete parsedSmfObject.props.layout.width;
    delete parsedSmfObject.props.layout.height;
  }
  else if (type === "HeaderBar" && dotProp.get(parsedSmfObject.props, "ios.navigationItem.title")) {
    var navTitle = parsedSmfObject.props.ios.navigationItem.title;
    parsedSmfObject.navigationItem = {
      title: navTitle
    };
    delete parsedSmfObject.props.ios;
  }

  if (REPEATED_VIEW_ITEM_MAP[type])
    parsedSmfObject.defaultItemType = REPEATED_VIEW_ITEM_MAP[type];

  if (type === "ListViewItem")
    Object.assign(parsedSmfObject.props, {
      width: null,
      height: null
    });

  if (obj.source && obj.source.page && parentComponent) {
    if (obj.source.page === MODULES_PAGE_NAME) {
      parsedSmfObject.isModuleComp = true;
      parsedSmfObject.modulePath = obj.source.modulePath;
      parsedSmfObject.moduleName = obj.source.moduleName;
      parsedSmfObject.libraryType = obj.source.moduleName;
    }
    else {
      parsedSmfObject.libID = obj.source.id ? obj.source.id : obj.id;
      if (obj.source.page === LIBRARY_PAGE_NAME && parentComponent.props.name === LIBRARY_PAGE_NAME) {
        parsedSmfObject.libraryType = util.capitalizeFirstLetter(parsedSmfObject.varName);
        parsedSmfObject.isLibraryComponent = true;
        globalLibComps.addLibComp(parsedSmfObject);
        //console.log(parsedSmfObject.name, `  libraryType: `, parsedSmfObject.libraryType);
      }
    }
  }
  return parsedSmfObject;
}

function checkPropIsValid(key, smfObject) {
  var res = true;
  positionRegex.lastIndex = 0;
  if (positionRegex.test(key)) {
    if (smfObject["userProps." + key] === "")
      res = false;
  }
  return res;
}

function checkParentIsLibraryComp(comp, comps) {
  var parentComp = comps[comp.parentID];
  if (parentComp) {
    if (globalLibComps.getLibraryType(parentComp.libID))
      return true;
    else
      return checkParentIsLibraryComp(parentComp, comps);
  }
  return false;
}

function prepareMapviewRefs(componentById, comps) {
  var mapviewRefs = [];
  comps.forEach(comp => {
    if (comp.type === "MapView")
      mapviewRefs.push(prepareOneMapviewRef(componentById, comp));
  });
  return mapviewRefs;
}

function prepareOneMapviewRef(componentById, mapComp) {
  if (mapComp.userProps.usePageVariable)
    return "this." + mapComp.props.name;
  var treeArr = getFamilyTree(componentById, mapComp);
  treeArr.reverse();
  treeArr.shift(); // remove page Name
  return `this.children.${treeArr.join(".children.")}`;
}

function prepareOneComponentRefForPage(componentById, comp) {
  const treeArr = getFamilyTree(componentById, comp);
  treeArr.reverse();
  treeArr.shift(); // remove page Name
  return `this.children.${treeArr.join(".children.")}`;
}

function prepareOneComponentRefForRoot(componentById, comp) {
  const treeArr = getFamilyTree(componentById, comp);
  treeArr.reverse();
  treeArr.shift(); // remove page Name
  treeArr.shift(); // remove root comp name
  return `this.children.${treeArr.join(".children.")}`;
}



function prepareComponentsAssignedToPage(smfObjects, componentById) {
  let childrenRefs = [];
  smfObjects.forEach((subSmfObject) => {
    const comp = componentById[subSmfObject.id];
    if (subSmfObject.usePageVariable)
      childrenRefs.push({ klass: createChildClassFromFamilyTree(componentById, comp), type: subSmfObject.libraryType || subSmfObject.type, ref: prepareOneComponentRefForPage(componentById, comp), name: subSmfObject.name });
    if (subSmfObject.smfObjects) {
      childrenRefs = childrenRefs.concat(prepareComponentsAssignedToPage(subSmfObject.smfObjects, componentById))
    }
  });
  return childrenRefs;
}

function getComponentsAssignedToRoot(smfObjects, componentById) {
  let childrenRefs = [];
  smfObjects.forEach((subSmfObject) => {
    const comp = componentById[subSmfObject.id];
    const klass = createChildClassFromFamilyTree(componentById, comp);
    if (comp.props.usePageVariable)
      childrenRefs.push({ klass, type: subSmfObject.libraryType || subSmfObject.type, ref: prepareOneComponentRefForRoot(componentById, comp), name: comp.props.name });
    if (subSmfObject.smfObjects) {
      childrenRefs = childrenRefs.concat(getComponentsAssignedToRoot(subSmfObject.smfObjects, componentById))
    }
  });
  return childrenRefs;
}

function createChildClassFromFamilyTree(componentById, comp) {
  const familyTree = getFamilyTree(componentById, comp);
  familyTree.reverse();
  familyTree.shift();
  const klass = "$" + familyTree.map(util.capitalizeFirstLetter).join("$$");
  return klass;
}

function prepareAndSetComponentsAssignedToRoot(smfObjects, componentById) {
  smfObjects.forEach((smfObject) => {
    if (smfObject.smfObjects) {
      smfObject.componentsAssignedToRoot = getComponentsAssignedToRoot(smfObject.smfObjects, componentById);
    }
  });
}

function getType(compname, comps) {
  var foundComp = comps.find(comp => comp.props.name === compname);
  return foundComp ? foundComp.type : null;
}

function handleInvalidLibraryComponents(components) {
  components.forEach(comp => {
    if (comp.source && comp.source.page === LIBRARY_PAGE_NAME &&
      comp.source.id && (!globalLibComps.getLibraryType(comp.source.id))) {
      delete comp.source;
    }
  });
}

function getAppropriateItemLength(gridViewComp, componentById) {
  var res = 200;
  if (gridViewComp.props.children && gridViewComp.props.children[0]) {
    var itemComp = componentById[gridViewComp.props.children[0]];
    if (gridViewComp.userProps.layout && gridViewComp.userProps.layout.scrollDirection === "HORIZONTAL")
      itemComp.userProps.width && (res = itemComp.userProps.width);
    else
      itemComp.userProps.height && (res = itemComp.userProps.height);
  }
  return res;
}

function extendComponetsFoShimmerFlexlayouts(components) {
  var _components = components.slice();
  var insertCount = 0;
  var tempId;
  var shimmerFlexLayoutsMap = {};
  components.forEach((comp, index) => {
    if (comp.type === "ShimmerFlexLayout" && comp.props.children && comp.props.children.length > 0) {
      tempId = comp.id + "contentLayout";
      shimmerFlexLayoutsMap[comp.id] = true;
      ++insertCount;
      _components.splice(index + insertCount, 0, {
        degree: comp.degree,
        className: "",
        id: tempId,
        props: {
          children: comp.props.children.slice(),
          name: "contentLayout",
          parent: comp.id
        },
        type: "FlexLayout",
        userProps: Object.assign({}, comp.userProps.layout, {
          flexProps: Object.assign(comp.userProps.layout ? comp.userProps.layout.flexProps : {}, {
            flexGrow: 1
          })
        })
      });
      comp.props.children = [tempId];
      delete comp.userProps.layout;
    }
    if (shimmerFlexLayoutsMap[comp.props.parent]) {
      comp.props.parent = comp.props.parent + "contentLayout";
    }
  });
  return _components;
}

function setLibComponentsTypes(smfObjects) {
  smfObjects.forEach(smfObject => {
    if (smfObject.libID && !smfObject.libraryType) {
      smfObject.libraryType = globalLibComps.getLibraryType(smfObject.libID);
      smfObject.libraryType && (smfObject.isLibraryComponent = true);
      //console.log(smfObject.name, "  libraryType: ", smfObject.libraryType, " ---2nd--");
    }
    smfObject.smfObjects && setLibComponentsTypes(smfObject.smfObjects);
  });
}

module.exports = parsePgx;