const LIBRARY_PAGE_NAME = "__library__";
const MODULES_PAGE_NAME = "__modules__";

module.exports = (components) => {
    var res = {
        libComps: [],
        moduleComps: []
    };
    components.forEach(comp => {
        if (comp.source && comp.source.id) {
            switch (comp.source.page) {
                case LIBRARY_PAGE_NAME:
                    res.libComps.push(comp.props.name);
                    break;
                case MODULES_PAGE_NAME:
                    res.moduleComps.push(comp.source.modulePath);
                    break;
                default:
            }
        }
    });
    return res;
};
