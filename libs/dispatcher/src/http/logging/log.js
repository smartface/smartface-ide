const DISPATCHER_URL = process.env.DISPATCHER_URL || '';
const pathParts = DISPATCHER_URL.split('/');
const USER = pathParts[pathParts.length - 2];
const WORKSPACE = pathParts[pathParts.length - 1];

let client;

module.exports = {
  init,
  send
};

function init(app, options) {
  // options = options || {};

  // try {

  //   client = new elasticsearch.Client({
  //     host: "http://167.71.49.163:9200",
  //     log: "error",
  //     auth: "smart:smartes2019",
  //     httpAuth: "smart:smartes2019"
  //   });

  //   client.ping(
  //     {
  //       // ping usually has a 3000ms timeout
  //       requestTimeout: 1000
  //     },
  //     function (error) {
  //       error && console.error(error);
  //     }
  //   );
  // } catch (e) {
  //   console.warn("Elasticsearch.Client couldn't be created !", e);
  // }

  app.post('/log/:logLevel/:index*?', (req, res, next) => {
    const callback = (err, data) => {
      res.status(err ? err.statusCode : 200).send(data);
    };

    const { logLevel } = req.params;
    const { index } = req.params;
    // console.log("LOGLEVEL: ", logLevel, " - ", index);
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', (_) => {
      send(logLevel, index, body, callback);
    });
    // req._body && send(logLevel, index, req.body, callback);
  }); //
}

function send(logLevel, index, body, callback) {
  // if (process.env.SMF_CIDE_WS_PATH) return;
  // if (typeof callback === 'undefined') {
  //   callback = () => { };
  // }

  // client
  //   && client.index
  //   && client.index(
  //     {
  //       index: index || 'workspace',
  //       type: 'log',
  //       body: {
  //         level: logLevel,
  //         time: new Date(),
  //         msg: body,
  //         user: USER || process.env.C9_USER,
  //         workspace: WORKSPACE || process.env.C9_PROJECT,
  //         region: process.env.REGION
  //       }
  //     },
  //     callback
  //   );
}
