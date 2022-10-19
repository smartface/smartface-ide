const dot = require('dot-object');
const dotProp = require('dot-prop');
const createAttributedStrings = require('@smartface/html-to-text');
const isPlainAttributedText = require('@smartface/html-to-text/util').isPlainAttributedText;
const { updateIdXmlContent } = require('../prepare-id-xml');
const getNestedChildrenTestIDs = require('../util/getNestedChildrenTestIDs');
const Mapper = require('./mapToSmartfaceObject');
const mapper = new Mapper();

const util = require('../util');
const { DEFAULT_PATHS, getProjectType, PROJECT_TYPES } = require('../config');
const LIBRARY_PAGE_NAME = DEFAULT_PATHS.LIBRARY_PAGE_NAME;
const MODULES_PAGE_NAME = DEFAULT_PATHS.MODULES_PAGE_NAME;
const getFamilyTree = util.getFamilyTree;
const globalLibComps = require('../smfObject/libComps');
const COMPONENT_BASED_PROP_MAP = require('../../defaultMap.json').componentBasedPropMap;

const ATTRIBUTES = require('./attributes');

const REPEATED_VIEW_ITEM_MAP = {
  ListView: 'ListViewItem',
  GridView: 'GridViewItem'
};

const LIST_ITEM_COMPONENTS = {
  ListViewItem: 'ListViewItem',
  GridViewItem: 'GridViewItem'
};

const CONTAINER_COMPONENTS = {
  FlexLayout: 'FlexLayout',
  ScrollView: 'ScrollView',
  ShimmerFlexLayout: 'ShimmerFlexLayout',
  ListViewItem: 'ListViewItem',
  GridViewItem: 'GridViewItem'
};

const STATIC_COMPONENTS = {
  BottomTabbar: 'bottomTabbar',
  StatusBar: 'statusBar',
  HeaderBar: 'headerBar',
  Page: 'page'
};

const POSITION_PROP = ['width', 'height', 'left', 'top', 'right', 'bottom'];

const positionRegex = /width|height|left|top|right|bottom/gi;

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
    if (component.degree === 0 && component.type !== 'Page') {
      return; // skip orphan component
    }
    var item = parseComponent(component, componentById[component.props.parent]);
    var treeArr = getFamilyTree(componentById, component);
    component.type === 'GridView' &&
      (item.layoutManager.onItemLength = `() => ${component.userProps.itemLength ||
        getAppropriateItemLength(component, componentById)}`);
    item.bundleID = '#' + treeArr.reverse().join('_');
    item.usePageVariable = false;
    if (component.type === 'Page') {
      item.testId = '_' + treeArr.map(name => util.capitalizeFirstLetter(name)).join('_');
    } else if (
      component.type !== 'Page' &&
      component.type !== 'StatusBar' &&
      component.type !== 'HeaderBar'
    ) {
      item.testId = '_' + treeArr.map(name => util.capitalizeFirstLetter(name)).join('_');
      updateIdXmlContent(item.testId);
      if (
        component.source &&
        component.source.type &&
        component.source.type.toLowerCase() === 'materialtextbox'
      ) {
        updateIdXmlContent(item.testId + '_textBox');
        delete item.props.testId;
        item.mtbTestId = item.testId;
      } else if (isLibraryPage) {
        item.props.testId = item.testId;
      }
      const isNameUnique = isLibraryPage
        ? checkIsComponentNameUniqueInLibraryComponent(componentById, component)
        : checkIsComponentNameUnique(componentById, component);
      if (
        !LIST_ITEM_COMPONENTS[component.type] &&
        isNameUnique &&
        !checkParentIsRepeatedCompAndNonRoot(componentById, component)
      ) {
        item.usePageVariable = true;
      }
    }
    delete item.props.testId;
    item.isLibraryPage = isLibraryPage;
    treeArr.length > 1 && treeArr.shift(); // remove pageName
    item.varName = '$' + treeArr.map(name => util.capitalizeFirstLetter(name)).join('$$');
    item.parentID = item.parent;
    item.initialized = component.initialized;
    item.oldName = component.oldName;
    item.parent && (item.parent = idNameObjects[item.parent]);
    item.children &&
      (item.children = item.children.map(child => {
        if (!idNameObjects[child])
          throw new Error(
            `No component with (${child}) id. Check '${components[0].props.name}.pgx' file!`
          );
        return {
          name: idNameObjects[child],
          constructorName: item.varName + '$$' + util.capitalizeFirstLetter(idNameObjects[child])
        };
      }));
    item.parentType = getType(item.parent, components);
    var headerItem = STATIC_COMPONENTS[item.type];
    compsObject[item.id] = item;
    if (STATIC_COMPONENTS[item.type]) {
      footer[headerItem] = item;
    } else {
      if (footer['page'] && item.parentID == footer['page'].id) {
        smfObjects.push(item);
        childrenOfPage.push({
          name: item.name,
          constructorName: item.varName
        });
      } else {
        var parentItem = compsObject[item.parentID];
        if (parentItem) {
          parentItem.smfObjects = parentItem.smfObjects || [];
          parentItem.smfObjects.push(item);
        }
      }
    }
    item.className = component.className || '';
    item.defaultClassNames = `${
      STATIC_COMPONENTS[item.type] ? '' : '.default_common'
    } .default_${util.lowercaseFirstLetter(item.type)}`;
    //(!isLibraryPage && (item.type === "ListViewItem")) && (item.className += ` ${item.bundleID}`);
    //isLibraryPage && (item.className += " #" + getFamilyTree(componentById, component).reverse().join("_"));
    item.ifNeededApplyingTestId =
      item.children && (item.defaultItemType ? false : item.children.length);
  });
  footer.mapviewRefs = prepareMapviewRefs(componentById, components);
  footer.pageName = footer.page ? footer.page.varName : '';
  if (footer.page) {
    footer.page.safeAreaEnabled = !!components[0].userProps.safeAreaEnabled;
  }
  const _smfObjects =
    footer.pageName === LIBRARY_PAGE_NAME
      ? smfObjects
      : smfObjects.filter(comp => !checkParentIsLibraryComp(comp, compsObject));

  setLibComponentsTypes(smfObjects.concat(footer.headerBar.smfObjects || []));

  if (isLibraryPage) {
    prepareAndSetComponentsAssignedToRoot(smfObjects, componentById);
    globalLibComps.prepareLibraryPageComps(smfObjects);
    _smfObjects.forEach(obj => {
      obj.testIDsList = getNestedChildrenTestIDs(obj, '');
    });
  } else {
    footer.page.testIDsList = getNestedChildrenTestIDs(
      { ...footer.page, smfObjects: _smfObjects },
      footer.page.testId
    );
    footer.page.testIDsList.forEach(id => updateIdXmlContent(id));
  }

  //_smfObjects.reverse();
  return Object.assign(
    {},
    {
      initialized: components[0].initialized,
      oldName: components[0].oldName,
      name: footer.page ? footer.page.name : '',
      pageName: footer.pageName,
      smfObjects: _smfObjects,
      fullSmfObjects: footer.headerBar.smfObjects
        ? _smfObjects.concat(footer.headerBar.smfObjects)
        : _smfObjects,
      footer: footer,
      children: childrenOfPage,
      componentsAssignedToPage: prepareComponentsAssignedToPage(smfObjects, componentById).concat(
        prepareHeaderLayoutsAssignedToPage(footer.headerBar.smfObjects, componentById)
      )
    }
  );
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
      testId: ''
    };

  // if (obj && obj.userProps && obj.userProps.testId) {
  //     parsedSmfObject.testId = obj.userProps.testId;
  // }
  var keys = Object.keys(smfObject),
    type = obj.type;
  keys.forEach(prop => {
    var smfKey = mapper.get(prop),
      value = smfObject[prop],
      tempName;

    if (prop === 'props.name') {
      parsedSmfObject.name = value;
      parsedSmfObject.varName = value;
    } else if (prop === 'props.parent') {
      parsedSmfObject.parent = value;
    } else if (smfKey === 'orientation') {
      parsedSmfObject.orientation = value;
    } else if (/userProps\.font|android|ios|layout\.*/.test(prop)) {
      tempName = prop.replace('userProps.', '');
      dotProp.set(parsedSmfObject.props, tempName, value);
    } else if (ATTRIBUTES.some(attribute => attribute === smfKey))
      parsedSmfObject.attributes[smfKey] = value;
    else if (typeof smfKey === 'string') {
      if (
        !(POSITION_PROP.indexOf(smfKey) !== -1 && STATIC_COMPONENTS[type]) &&
        checkPropIsValid(smfKey, smfObject)
      ) {
        if (COMP_PROP_MAP && COMP_PROP_MAP[smfKey]) {
          dotProp.set(parsedSmfObject.props, COMP_PROP_MAP[smfKey], value);
        } else {
          tempName = prop.replace('userProps.', '');
          dotProp.set(parsedSmfObject.props, tempName, value);
        }
      }
    }
  });
  if (parsedSmfObject.props.ios && parsedSmfObject.props.ios.shadowOpacity) {
    parsedSmfObject.props.ios.masksToBounds = false;
  }
  if (
    parsedSmfObject.props.layout &&
    parsedSmfObject.props.layout.ios &&
    parsedSmfObject.props.layout.ios.shadowOpacity
  ) {
    parsedSmfObject.props.layout.ios.masksToBounds = false;
  }
  parsedSmfObject.type = smfObject.type;
  parsedSmfObject.id = obj.id;
  //parsedSmfObject.type !== "HeaderBar" && (parsedSmfObject.attributes.skipDefaults = true);
  if (type === 'GridView') {
    // TODO itemLength from collectionViewItem
    parsedSmfObject.layoutManager = Object.assign(parsedSmfObject.props.layoutManager || {});
    delete parsedSmfObject.props.layoutManager;
    if (getProjectType() !== PROJECT_TYPES.ts) {
      parsedSmfObject.attributes.layoutManager = 'layoutManager';
    }
  } else if (type === 'TextView') {
    var isPlainText = true;
    createAttributedStrings(obj.userProps.html || '').forEach(t => {
      !isPlainAttributedText(t) && (isPlainText = false);
    });
    if (!isPlainText) {
      parsedSmfObject.html = obj.userProps.html ? obj.userProps.html : null;
      delete parsedSmfObject.props.font;
    }
  } else if (
    type === 'ScrollView' &&
    parsedSmfObject.attributes.autoSizeEnabled &&
    parsedSmfObject.props.layout
  ) {
    delete parsedSmfObject.props.layout.width;
    delete parsedSmfObject.props.layout.height;
  } else if (
    type === 'HeaderBar' &&
    dotProp.get(parsedSmfObject.props, 'ios.navigationItem.title')
  ) {
    var navTitle = parsedSmfObject.props.ios.navigationItem.title;
    parsedSmfObject.navigationItem = {
      title: navTitle
    };
    delete parsedSmfObject.props.ios;
  } else if (type === 'ImageView' && parsedSmfObject.attributes.image) {
    if (/http:\/\/|https:\/\//.test(parsedSmfObject.attributes.image)) {
      parsedSmfObject.loadFromUrlImage = parsedSmfObject.attributes.image;
      delete parsedSmfObject.attributes.image;
    } else {
      parsedSmfObject.attributes.image = `images://${parsedSmfObject.attributes.image}`;
    }
  }

  if (REPEATED_VIEW_ITEM_MAP[type]) parsedSmfObject.defaultItemType = REPEATED_VIEW_ITEM_MAP[type];

  if (type === 'ListViewItem')
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
    } else {
      parsedSmfObject.libID = obj.source.id ? obj.source.id : obj.id;
      if (
        obj.source.page === LIBRARY_PAGE_NAME &&
        parentComponent.props.name === LIBRARY_PAGE_NAME
      ) {
        parsedSmfObject.libraryType = util.capitalizeFirstLetter(parsedSmfObject.varName);
        parsedSmfObject.isLibraryComponent = true;
        globalLibComps.addLibComp(parsedSmfObject);
        //console.log(parsedSmfObject.name, `  libraryType: `, parsedSmfObject.libraryType);
      }
    }
  }
  if (CONTAINER_COMPONENTS[parsedSmfObject.type]) {
    parsedSmfObject.isContainerComponent = true;
  }
  return parsedSmfObject;
}

function prepareTestIDsList(page) {
  if (
    component.type !== 'Page' &&
    component.type !== 'StatusBar' &&
    component.type !== 'HeaderBar'
  ) {
    item.testId = '_' + treeArr.map(name => util.capitalizeFirstLetter(name)).join('_');
    updateIdXmlContent(item.testId);
    if (
      component.source &&
      component.source.type &&
      component.source.type.toLowerCase() === 'materialtextbox'
    ) {
      updateIdXmlContent(item.testId + '_textBox');
      delete item.props.testId;
      item.mtbTestId = item.testId;
    } else if (item.libID) {
      item.props.testId = item.testId;
    }
  }
}

function checkPropIsValid(key, smfObject) {
  var res = true;
  positionRegex.lastIndex = 0;
  if (positionRegex.test(key)) {
    if (smfObject['userProps.' + key] === '') res = false;
  }
  return res;
}

function checkParentIsRepeatedCompAndNonRoot(componentById, comp) {
  const parentComp = componentById[comp.props.parent];
  if (parentComp) {
    const oldParentComp = componentById[parentComp.props.parent];
    if (
      LIST_ITEM_COMPONENTS[parentComp.type] &&
      oldParentComp &&
      oldParentComp.props.name !== LIBRARY_PAGE_NAME
    )
      return parentComp;
    else return checkParentIsRepeatedCompAndNonRoot(componentById, parentComp);
  }
  return false;
}

function checkParentIsLibraryComp(comp, comps) {
  var parentComp = comps[comp.parentID];
  if (parentComp) {
    if (globalLibComps.getLibraryType(parentComp.libID)) return true;
    else return checkParentIsLibraryComp(parentComp, comps);
  }
  return false;
}

function prepareMapviewRefs(componentById, comps) {
  var mapviewRefs = [];
  comps.forEach(comp => {
    if (comp.type === 'MapView') mapviewRefs.push(prepareOneMapviewRef(componentById, comp));
  });
  return mapviewRefs;
}

function prepareOneMapviewRef(componentById, mapComp) {
  if (mapComp.userProps.usePageVariable) return 'this.' + mapComp.props.name;
  var treeArr = getFamilyTree(componentById, mapComp);
  treeArr.reverse();
  treeArr.shift(); // remove page Name
  return `this.children.${treeArr.join('.children.')}`;
}

function prepareOneComponentRefForPage(componentById, comp, prefix = 'children') {
  const treeArr = getFamilyTree(componentById, comp);
  treeArr.reverse();
  treeArr.shift(); // remove page Name
  return `this.${prefix}.${treeArr.join('.children.')}`;
}

function prepareOneComponentRefForRoot(componentById, comp, prefix = 'children') {
  const treeArr = getFamilyTree(componentById, comp);
  treeArr.reverse();
  treeArr.shift(); // remove page Name
  treeArr.shift(); // remove root comp name
  return `this.${prefix}.${treeArr.join('.children.')}`;
}

function getAllComponentsInRoot(componentById, parent) {
  let res = [parent];
  if (parent.props.children && parent.props.children.length) {
    parent.props.children.forEach(childId => {
      res = res.concat(getAllComponentsInRoot(componentById, componentById[childId]));
    });
  }
  return res;
}

function getLibraryRootComp(componentID, id) {
  const parent = componentID[id];
  if (parent && parent.props.parent) {
    if (
      componentID[parent.props.parent] &&
      componentID[parent.props.parent].props.name === LIBRARY_PAGE_NAME
    ) {
      return parent;
    }
    return getLibraryRootComp(componentID, parent.props.parent);
  }
  return null;
}

function checkIsComponentNameUniqueInLibraryComponent(componentID, comp) {
  const parent = getLibraryRootComp(componentID, comp.props.parent);
  return (
    parent &&
    !getAllComponentsInRoot(componentID, parent).some(
      c => comp.id !== c.id && c.props.name === comp.props.name
    )
  );
}

function checkIsComponentNameUnique(componentById, comp) {
  return !Object.keys(componentById).some(
    key => comp.id !== key && comp.props.name === componentById[key].props.name
  );
}

function prepareHeaderLayoutsAssignedToPage(smfObjects, componentById, prefix) {
  let childrenRefs = [];
  if (smfObjects) {
    smfObjects.forEach(subSmfObject => {
      const comp = componentById[subSmfObject.id];
      if (subSmfObject.usePageVariable)
        childrenRefs.push({
          klass: createChildClassFromFamilyTree(componentById, comp),
          type: subSmfObject.libraryType || subSmfObject.type,
          ref: prefix ? `${prefix}.${subSmfObject.name}` : `new ${subSmfObject.varName}()`,
          name: subSmfObject.name
        });
      if (subSmfObject.smfObjects) {
        childrenRefs = childrenRefs.concat(
          prepareHeaderLayoutsAssignedToPage(
            subSmfObject.smfObjects,
            componentById,
            `this.${subSmfObject.name}.children`
          )
        );
      }
    });
  }
  return childrenRefs;
}

function prepareComponentsAssignedToPage(smfObjects, componentById) {
  let childrenRefs = [];
  smfObjects.forEach(subSmfObject => {
    const comp = componentById[subSmfObject.id];
    if (subSmfObject.usePageVariable)
      childrenRefs.push({
        klass: createChildClassFromFamilyTree(componentById, comp),
        type: subSmfObject.libraryType || subSmfObject.type,
        ref: prepareOneComponentRefForPage(componentById, comp),
        name: subSmfObject.name
      });
    if (subSmfObject.smfObjects) {
      childrenRefs = childrenRefs.concat(
        prepareComponentsAssignedToPage(subSmfObject.smfObjects, componentById)
      );
    }
  });
  return childrenRefs;
}

function getComponentsAssignedToRoot(smfObjects, componentById, smfObjectRoot) {
  let childrenRefs = [];
  smfObjects.forEach(subSmfObject => {
    const comp = componentById[subSmfObject.id];
    const klass = createChildClassFromFamilyTree(componentById, comp);
    //console.log('A: ', subSmfObject.name, ' - ', subSmfObject.usePageVariable);
    if (
      subSmfObject.usePageVariable &&
      checkIsComponentNameUniqueInLibraryComponent(componentById, comp, smfObjectRoot)
    )
      childrenRefs.push({
        klass,
        type: subSmfObject.libraryType || subSmfObject.type,
        ref: prepareOneComponentRefForRoot(componentById, comp),
        name: comp.props.name
      });
    if (subSmfObject.smfObjects) {
      childrenRefs = childrenRefs.concat(
        getComponentsAssignedToRoot(subSmfObject.smfObjects, componentById, smfObjectRoot)
      );
    }
  });
  return childrenRefs;
}

function createChildClassFromFamilyTree(componentById, comp) {
  const familyTree = getFamilyTree(componentById, comp);
  familyTree.reverse();
  familyTree.shift();
  const klass = '$' + familyTree.map(util.capitalizeFirstLetter).join('$$');
  return klass;
}

function prepareAndSetComponentsAssignedToRoot(smfObjects, componentById) {
  smfObjects.forEach(smfObject => {
    if (smfObject.smfObjects) {
      smfObject.componentsAssignedToRoot = getComponentsAssignedToRoot(
        smfObject.smfObjects,
        componentById,
        smfObject
      );
    }
  });
}

function getType(compname, comps) {
  var foundComp = comps.find(comp => comp.props.name === compname);
  return foundComp ? foundComp.type : null;
}

function handleInvalidLibraryComponents(components) {
  components.forEach(comp => {
    if (
      comp.source &&
      comp.source.page === LIBRARY_PAGE_NAME &&
      comp.source.id &&
      !globalLibComps.getLibraryType(comp.source.id)
    ) {
      delete comp.source;
    }
  });
}

function getAppropriateItemLength(gridViewComp, componentById) {
  var res = gridViewComp.userProps.itemLength;
  if (gridViewComp.props.children && gridViewComp.props.children[0]) {
    var itemComp = componentById[gridViewComp.props.children[0]];
    if (
      gridViewComp.userProps.layout &&
      gridViewComp.userProps.layout.scrollDirection === 'HORIZONTAL'
    )
      itemComp.userProps.width && (res = itemComp.userProps.width);
    else
      itemComp.userProps.height &&
        (res = gridViewComp.userProps.itemLength || itemComp.userProps.height);
  }
  return res;
}

function extendComponetsFoShimmerFlexlayouts(components) {
  var _components = components.slice();
  var insertCount = 0;
  var tempId;
  var shimmerFlexLayoutsMap = {};
  components.forEach((comp, index) => {
    if (
      comp.type === 'ShimmerFlexLayout' &&
      comp.props.children &&
      comp.props.children.length > 0
    ) {
      tempId = comp.id + 'contentLayout';
      shimmerFlexLayoutsMap[comp.id] = true;
      ++insertCount;
      _components.splice(index + insertCount, 0, {
        degree: comp.degree,
        className: '',
        id: tempId,
        props: {
          children: comp.props.children.slice(),
          name: 'contentLayout',
          parent: comp.id
        },
        type: 'FlexLayout',
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
      comp.props.parent = comp.props.parent + 'contentLayout';
    }
  });
  return _components;
}

function setLibComponentsTypes(smfObjects) {
  smfObjects.forEach(smfObject => {
    if (smfObject.libID && !smfObject.libraryType) {
      smfObject.libraryType = globalLibComps.getLibraryType(smfObject.libID);
      smfObject.libraryType && (smfObject.isLibraryComponent = true);
      smfObject.libComp = globalLibComps.getLibComps();
      //console.log(smfObject.name, "  libraryType: ", smfObject.libraryType, " ---2nd--");
    }
    smfObject.smfObjects && setLibComponentsTypes(smfObject.smfObjects);
  });
}

module.exports = parsePgx;
