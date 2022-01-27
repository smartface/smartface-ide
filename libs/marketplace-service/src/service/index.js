const DEV = (!process.env.REGION || process.env.REGION === "dev") ? "dev-" : "";

const https = require('https');
const ENV = "";
const SERVER = {
  enterpriseapi: process.env.SMARTFACE_ENTERPRISE_API || DEV + 'enterpriseapi' + ENV + '.smartface.io',
  marketplaceapi: process.env.SMARTFACE_MARKETPLACE_API || DEV + "marketplace-api.smartface.io",
  portalapi: process.env.SMARTFACE_PORTAL_API || DEV + 'portalapi' + ENV + '.smartface.io',
  cbc: process.env.SMARTFACE_CBC_API || 'cbc.smartface.io',
  license: process.env.SMARTFACE_LICENSE_API || DEV + 'license' + ENV + '.smartface.io',
  dashboard: process.env.SMARTFACE_DASHBOARD_API || DEV + 'cloud' + ENV + '.smartface.io',
  test: "7d5cb8f4-03ff-44e0-ba1d-752b01f1ebcd.mock.pstmn.io"
};
exports.SERVER = SERVER;
exports.getUploadOptions = (tenantId, token) => {
  return {
    host: SERVER.marketplaceapi,
    path: `/api/${tenantId}/assets/publish`,
    method: "POST",
    headers: {
      Authorization: token || "Bearer dummyToken"
    }
  };
};

exports.getPackageInfo = (name, version, tenantId, token) => {
  return httpsReq({
    host: SERVER.marketplaceapi,
    path: `/api/${tenantId}/assets/${name}/${version}`,
    method: "GET",
    headers: {
      Authorization: token || "Bearer dummyToken"
    }
  });
};

exports.getAssets = (tenantId, token) => {
  return httpsReq({
    host: SERVER.marketplaceapi,
    path: `/api/${tenantId}/assets`,
    method: "GET",
    headers: {
      Authorization: token || "Bearer dummyToken"
    }
  });
};

exports.incrementInstallCount = (name, version, tenantId, token) => {
  return httpsReq({
    host: SERVER.marketplaceapi,
    path: `/api/${tenantId}/assets/${name}/${version}/install`,
    method: "POST",
    headers: {
      Authorization: token || "Bearer dummyToken"
    }
  });
};
//private
// helper get.
function httpsReq(options) {
  var result = {};
  return new Promise((resolve, reject) => {
    //console.log("RequestOptions: ", JSON.stringify(options, null, "\t"));
    const req = https.request(options, (res) => {
      // consume response body
      res.resume();
      var str = '';
      var json;
      res.on('data', function (chunk) {
        str += chunk.toString();
      });
      res.on('end', function () {
        try {
          json = JSON.parse(str);
        }
        catch (e) { }
        json && (json.Message || json.message) && (str = json.Message || json.message);
        result.msg = str;
        result.json = json;
        result.statusCode = res.statusCode;
        result.statusMessage = res.statusMessage;
        //console.dir(result);
        if (!(res.statusCode < 300 && res.statusCode >= 200)) {
          return reject({
            err: "Server Error",
            msg: `${res.statusCode} : ${res.statusMessage}`,
            stack: str /*+ `\n ${JSON.stringify(options,null,"\t")}`*/
          });
        }
        else
          return resolve(result);
      });
    });
    req.on('error', (e) => {
      e.err = "Connection Error";
      reject(e); // connection error.
    });
    req.end();
  });
}
