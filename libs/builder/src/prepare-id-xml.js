const fs = require('fs');
const path = require('path');
const xmlmerge = require("@smartface/xmlmergejs");

const { getPath } = require('./config');
const { getIdXmlCompiler } = require('./core/templateEngine');

const idXML = {};
const idCompiler = getIdXmlCompiler();

function updateIdXmlContent(id) {
    idXML[id] = 1;
}

async function writeIdXml() {
    const idsXml = fs.readFileSync(getPath('ANDROID_ID_XML'), 'utf8');
    const newIdsXml = idCompiler({ ids: Object.keys(idXML) });
    return new Promise((resolve, reject) => {
        xmlmerge.merge(idsXml, newIdsXml, [{
            nodename: "*",
            attrname: "name"
        }], function (xmlRes) {
            fs.writeFileSync(getPath('ANDROID_ID_XML'), xmlRes.replace(/\/\>/gi, '/>\n'), 'utf8');
            console.log('├─ ℹ️  Updated ids.xml...');
            resolve(xmlRes)
        });
    });

}

module.exports = {
    writeIdXml,
    updateIdXmlContent
}