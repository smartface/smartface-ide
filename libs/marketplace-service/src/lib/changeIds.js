module.exports = (components) => {
    var idMap = {};

    // TODO: If specified component is from library, then get new copy of 
    // component from library and set the component props and add as a duplicated
    components.forEach((comp, index) => {
        var newID = guid();
        idMap[comp.id] = newID;
        comp.id = newID;
    });

    components.forEach(item => {
        (item.props.parent && idMap[item.props.parent]) && (item.props.parent = idMap[item.props.parent]);
        item.props.children && (item.props.children = item.props.children.map(child => idMap[child]));
    });
};

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function guid() {
    return s4() + "-" + s4() + "-" + s4() + "-" + s4();
}
