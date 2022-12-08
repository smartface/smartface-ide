const path = require('path');
const util = require('../util');

const BASE_ROUTER_MAP = {
  AppRouter: 'Router',
  Router: 'Router',
  StackRouter: 'NativeStackRouter',
  BottomTabBarRouter: 'BottomTabbar',
  Route: 'Route'
};

const PROP_MAP = {
  modal: 'modal',
  modalType: 'modalType',
  bottomSheetOptions: 'bottomSheetOptions'
};

const getFullPath = (componentByID, id, isLib = false) => {
  const comp = componentByID[id];
  if (comp.parent) {
    return `${getFullPath(componentByID, comp.parent)}/${comp.props.path || ''}`;
  }
  return isLib ? '/' : `${comp.props.path}`;
};

const componentPropsAssigner = (componentByID, comp, compProps, isLib = false) => {
  const props = {};
  const childrenNames = comp.children.map(c => componentByID[c].name);
  if (compProps.homeRoute) {
    props.homeRoute = childrenNames.indexOf(compProps.homeRoute);
  }
  if (!isLib) {
    props.path = path.normalize(getFullPath(componentByID, comp.id));
    if (compProps.to) {
      props.to = `${props.path}/${compProps.to}`;
    }
  }
  Object.keys(PROP_MAP)
    .filter(p => compProps[p])
    .forEach(p => {
      props[p] = compProps[p];
    });

  if (props.bottomSheetOptions?.detents) {
    props.bottomSheetOptions.detents = compProps.bottomSheetOptions.detents
      .split(',')
      .map(s => s.trim());
  }

  return props;
};

const getVarName = (componentByID, id) => {
  const comp = componentByID[id];
  if (comp.parent) {
    return `${getVarName(componentByID, comp.parent)}_${util.capitalizeFirstLetter(comp.name)}`;
  }
  return util.capitalizeFirstLetter(comp.name);
};

function parseRouterFile(routersObj) {
  const appRouters = [];
  let libRouters = [];
  const imports = {};

  const parseRouterHelper = (componentByID, id, routers, imports, isLib = false) => {
    const comp = componentByID[id];
    const parent = comp.parent ? componentByID[comp.parent] : { name: '' };
    let pageVarName = comp.props.page ? util.capitalizeFirstLetter(comp.props.page) : 'Page';
    const isLibComp = !!comp.source?.id;
    const libComp = componentByID[comp.source?.id];
    if (isLibComp) {
      const varName = util.capitalizeFirstLetter(libComp.name);
      imports[varName] = `${isLib ? './' : './components/'}${varName}`;
    } else if (comp.type === 'Route' && pageVarName !== 'Page') {
      imports[pageVarName] = `pages/${comp.props.page}`;
    } else if (comp.type === 'BottomTabBarRouter') {
      imports['BottomTabbar'] = isLib ? '../BottomTabbar' : `./BottomTabbar`;
    }
    const childrenVarNames = comp.children.map(c => {
      const isLibComp = componentByID[c].source?.id;
      return {
        name: componentByID[c].name,
        type: componentByID[c].type,
        isLibComp,
        varName: isLibComp
          ? util.capitalizeFirstLetter(componentByID[componentByID[c].source.id].name)
          : `$$${getVarName(componentByID, c)}`
      };
    });
    if (isLibComp) {
      //ignore lib comp.
      return;
    }
    routers.push({
      ...comp,
      path: path.normalize(getFullPath(componentByID, comp.id)),
      to: comp.props.to ? `${comp.props.path}/${comp.props.to}` : undefined,
      hasBottomTabBarRouter: comp.children.some(
        c => componentByID[c].type === 'BottomTabBarRouter'
      ),
      routes: childrenVarNames,
      varName: `$$${getVarName(componentByID, comp.id)}`,
      baseRouter: BASE_ROUTER_MAP[comp.type],
      pageVarName: pageVarName,
      props: componentPropsAssigner(componentByID, comp, comp.props, isLib)
    });
    comp.children.forEach(c => parseRouterHelper(componentByID, c, routers, imports, isLib));
  };
  const appComp = routersObj.componentByID[routersObj.appRoot];
  const libComp = routersObj.componentByID[routersObj.libRoot];

  parseRouterHelper(routersObj.componentByID, routersObj.appRoot, appRouters, imports);
  libRouters = libComp.children.map(c => {
    const childRouters = [];
    const imports = {};
    routersObj.componentByID[c].parent = null;
    parseRouterHelper(routersObj.componentByID, c, childRouters, imports, true /* isLib */);
    return {
      fileName: util.capitalizeFirstLetter(childRouters[0].name),
      routers: childRouters,
      imports: Object.keys(imports).map(k => ({ name: k, from: imports[k] }))
    };
  });

  return {
    imports: Object.keys(imports).map(k => ({ name: k, from: imports[k] })),
    libRouters,
    appRouters
  };
}

module.exports = parseRouterFile;
