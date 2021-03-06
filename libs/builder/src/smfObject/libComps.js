const util = require("../util");
const DEFAULT_PATHS = require("../config").DEFAULT_PATHS;
const LIBRARY_PAGE_NAME = DEFAULT_PATHS.LIBRARY_PAGE_NAME;

module.exports = (function() {

  var libComps = {};
  // prepare children data.
  function prepareLibComps(libraryPage) {
    var res = {};

    // find library components.
    libraryPage.smfObjects.forEach(comp => {
      if (comp.parent === LIBRARY_PAGE_NAME) {
        if (comp.type === "ScrollView")
          comp.isNeedScwLayoutProps = true;
        res[comp.id] = comp;
        comp.pageName = comp.varName;
        delete comp.props.left;
        delete comp.props.top;
        delete comp.props.right;
        delete comp.props.bottom;
      }
    });

    // set children of library componnets.
    findAndSetLibComponents(libraryPage.smfObjects, res);

    libComps = res;

    return Object.keys(res).map(function(key) {
      return res[key];
    });

  }

  function getLibComps() {
    return libComps;
  }

  function addLibComp(obj) {
    libComps[obj.id] = obj;
  }


  function getLibraryType(id) {
    if (libComps && libComps[id]) {
      return libComps[id].libraryType;
    }
    return null;
  }

  function findAndSetLibComponents(smfObjects, comps) {
    smfObjects.forEach(comp => {
      if (comp.parent !== LIBRARY_PAGE_NAME) {
        if (comp.id !== comp.libID) {
          if (!comps[comp.libID]) {
            return comp.isLibraryComponent = false;
          }
          comp.libraryType = comps[comp.libID].libraryType;
          comp.isLibComp = "ThisIsLibComponent";
          comp.isLibraryComponent = true;
        }
        var parentLibComp = getLibCompParent(comp, comps);
        if (parentLibComp && !(checkLibComponentAlreadyExist(comp, comps))) {
          if (comp.type === "ScrollView")
            parentLibComp.isNeedScwLayoutProps = true;
        }
      }
      comp.smfObjects && findAndSetLibComponents(comp.smfObjects, comps);
    });
  }

  return {
    prepareLibComps: prepareLibComps,
    getLibComps: getLibComps,
    addLibComp: addLibComp,
    getLibraryType: getLibraryType,
    getLibCompParent: function(comp) {
      return getLibCompParent(comp, getLibComps());
    }
  };

})();

function getLibCompParent(comp, components) {
  var parentComp = components[comp.parent];
  if (parentComp) {
    if (parentComp.parent === LIBRARY_PAGE_NAME) {
      return parentComp;
    }
    else {
      return getLibCompParent(parentComp, components);
    }
  }
}

function checkLibComponentAlreadyExist(comp, comps) {
  var parentComp = comps[comp.parentID];
  if (!parentComp) {
    return false;
  }
  if (parentComp.id !== parentComp.libID) {
    return true;
  }
  else {
    return checkLibComponentAlreadyExist(parentComp, comps);
  }
}
