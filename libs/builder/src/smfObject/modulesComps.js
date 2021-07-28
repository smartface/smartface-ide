const util = require("../util");
const writeError = util.writeError;

module.exports = (function () {

    var modulesComps = [];
    return {
        setModulesComponents: comps => modulesComps = comps.slice(),
        getModuleComponent: (id) => modulesComps.find(comp => comp.id === id),
        componentExists: (id) => !!modulesComps.find(comp => comp.id === id),
        startMarketplaceClient: () => {
        }
    };
})();
