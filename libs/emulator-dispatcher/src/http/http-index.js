module.exports = function (express, app, options) {
  options = options || {
    logToConsole: false
  };
  const bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');
  const https = require('https');
  const rauTokenStore = {};

  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(cookieParser());

  // For CORS
  app.use((req, res, next) => {
    const origin = req.get('origin');
    origin && res.header('Access-Control-Allow-Origin', req.header('origin'));
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', true);
    next();
  });

  app.get('/', (req, res) => {
    res.status(200).send('Smartface dispatcher is up and running').end();
  });

  const rauTokenRequestOptions = {
    host: process.env.SMARTFACE_DASHBOARD_HOST,
    path: '/api/ide/token',
    method: 'GET'
  };

  function getSmartfaceAuthCookies(cookies) {
    let res = '';
    Object
      .keys(cookies)
      .forEach((cookie) => {
        if (/SmartfaceAuth/ig.test(cookie)) {
          res += `${cookie}=${cookies[cookie]};`;
        }
      });
    return res;
  }

  function setToken(req, res, next) {
    const { secret } = req.params;
    const { server } = req.params;
    let port;
    server && (port = server.match(/:\d+/));
    const options = {
      headers: {
        Accept: 'text/plain; charset=us-ascii',
        Cookie: getSmartfaceAuthCookies(req.cookies)
      },
      ...rauTokenRequestOptions
    };
    if (server) { /*
            port = server.match(/:\d+/);
            options.host = server.replace(/:\d+/, "");
            if (port && port.length === 1) {
                options.port = port[0].replace(":", "");
            } */
    }
    const rauTokenRequest = https.request(options, rauTokenRequestCallback);

    rauTokenRequest.on('error', (e) => {
      res.status(500)
        .header('Content-Type', 'text/plain; charset=us-ascii')
        .send(e.message)
        .end();
    });

    rauTokenRequest.end();

    function rauTokenRequestCallback(response) {
      let str = '';
      response.on('data', (chunk) => {
        str += chunk;
      });

      response.on('end', function () {
        res.status(this.statusCode).end();
        if (this.statusCode) rauTokenStore[secret] = str;
      });
      response.on('error', function () {
        console.dir(arguments);
      });
    }
  }

  app.post('/token/:secret/:server', setToken);
  app.post('/token/:secret', setToken);

  app.get('/token/:secret', (req, res, next) => {
    // TODO: later for security, accept clients only from local host
    const { secret } = req.params;
    const token = rauTokenStore[secret];
    const status = token ? 200 : 404;
    const message = token ? `Bearer ${token}` : 'Token for secret not found';
    res.status(status)
      .header('Content-Type', 'text/plain; charset=us-ascii')
      .send(message)
      .end();
    token && (delete rauTokenStore[secret]);
  });

  app.get('/sockets', (req, res, next) => {
    let txt = '<html><head><title>List of Connected Sockets</title></head><body><h1>Device WebSockets</h1><p><ul>';
    const { allWebsockets } = global.shared;
    const { allUIWebsockets } = global.shared;
    let key; let
      ws;
    for (key in allWebsockets) {
      ws = allWebsockets[key].ws;
      if (ws.readyState === 1) {
        txt += `<li>${key}</li>`;
      }
    }
    txt += '</ul></p><h1>UI WebSockets</h1><p><ul>';
    for (key in allUIWebsockets) {
      ws = allUIWebsockets[key].ws;
      if (ws.readyState === 1) {
        txt += `<li>${key}</li>`;
      }
    }
    txt += '</ul></p></body>';
    res.status(200).send(txt).end();
  });

  require('./logging/log').init(app, options);
  require('./image-serve/image-serve')(app, options);
  require('./file-serve/file-serve')(express, app, options);
};
