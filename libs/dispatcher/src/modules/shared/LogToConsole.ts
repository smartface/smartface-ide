/**
 * If both parameters are not provided, logging is disabled
 * @param {boolean} Whether logging is enabled or not
 * @param {string} Which service to be used (LogToConsole.SERVICES), could be undefined
 */
export default class LogToConsole {
  static instance: LogToConsole;

  constructor() {
    LogToConsole.instance = this;
  }

  log(...args) {
    console.log.apply(null, args);
  }

  info(...args) {
    console.info.apply(null, args);
  }

  warn(...args) {
    console.warn.apply(null, args);
  }

  error(...args) {
    console.error.apply(null, args);
  }

  fatal(...args) {
    console.error.apply(null, args);
  }

  debug(...args) {
    console.log.apply(null, ['[DEBUG]'].concat(args));
  }
}
