const copyData = require("../util/copyData");

module.exports = (components, rootCompID, withoutLib) => {
    var componentByID = {};
    components.forEach(comp => componentByID[comp.id] = copyData(comp));
    return getComponentWithChildren(componentByID, rootCompID, withoutLib);
};

function getComponentWithChildren(componentByID, rootCompID, withoutLib) {
    var res = componentByID[rootCompID] ? [componentByID[rootCompID]] : [];
    var comp = componentByID[rootCompID];

    if (withoutLib && comp && comp.source && comp.source.id && comp.source.page === "__library__") {
        comp.props.children = componentByID[comp.source.id].props.children;
        delete comp.source.id;
        delete comp.source.type;
    }
    if (!withoutLib && comp && comp.source.id) {
        componentByID[comp.source.id].props.children.forEach(child => {
            res = res.concat(getComponentWithChildren(componentByID, child, withoutLib));
        });
    }
    else if (comp && comp.props.children &&
        comp.props.children.length) {
        comp.props.children.forEach(child => {
            componentByID[child].props.parent = comp.id;
            res = res.concat(getComponentWithChildren(componentByID, child, withoutLib));
        });
    }
    return res;
}
