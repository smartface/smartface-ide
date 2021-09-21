const globalLibComps = require("../smfObject/libComps");

module.exports = function getNestedChildrenTestIDs(smfObject, testID) {
    let res = [];
    if (smfObject.smfObjects) {
        smfObject.smfObjects.forEach(childSmfObject => {
            const childTestID = testID + '_' + childSmfObject.name;
            res.push(childTestID);
            res = res.concat(getNestedChildrenTestIDs(childSmfObject, childTestID));
        });
    } else if (smfObject.libID && (smfObject.libID !== smfObject.id)) {
        res = res.concat(globalLibComps.getLibraryNestedChildrenTestIDs(smfObject.libID, testID));
    }
    return res;
};