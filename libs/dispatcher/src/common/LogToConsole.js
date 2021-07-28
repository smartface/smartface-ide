const { send } = require('../http/logging/log');

/**
 * If both parameters are not provided, logging is disabled
 * @param {boolean} Whether logging is enabled or not
 * @param {string} Which service to be used (LogToConsole.SERVICES), could be undefined
 */
function LogToConsole(enabled, service) {
  const self = this;
  this.enabled = (typeof enabled == 'undefined') ? false : enabled;
  this.service = (typeof service == 'undefined') ? '' : service;
  if (ALLOWED_SERVICES.indexOf(this.service) < 0) {
    this.service = '';
  }

  this.log = function () {
    arguments = Array.prototype.slice.call(arguments);
    self.service && arguments.unshift(self.service);
    console.log.apply(null, arguments);
    if (self.enabled) {
      send('all', 'dispatcher', arguments.join(' '));
    }
  };
  
  this.debug = function () {
    arguments = Array.prototype.slice.call(arguments);
    self.service && arguments.unshift(self.service);
    console.log.apply(null, ["[DEBUG]"].concat(arguments));
  };

}

const SERVICES = {
  CONTROL: '[CONTROL]',
  FILE_TRANSFER: '[FILE]',
  DEBUGGER: '[DEBUGGER]',
  UI: '[UI]',
  HTTP: '[HTTP]',
  PROCESS: '[PROCESS]'
};

const ALLOWED_SERVICES = [
  SERVICES.CONTROL,
  SERVICES.FILE_TRANSFER,
  SERVICES.DEBUGGER,
  SERVICES.UI,
  SERVICES.HTTP,
  SERVICES.PROCESS
];

module.exports = LogToConsole;
