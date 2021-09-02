
/**
 * If both parameters are not provided, logging is disabled
 * @param {boolean} Whether logging is enabled or not
 * @param {string} Which service to be used (LogToConsole.SERVICES), could be undefined
 */
export default class LogToConsole {

  constructor(private enabled: boolean, private service: string){
    this.enabled;
    this.service;
  }

  log(...args) {
    this.service && args.unshift(this.service);
    console.log.apply(null, args);
    /* OLD
    if (this..enabled) {
      send('all', 'dispatcher', arguments.join(' '));
    }
    */
  };
  
  debug (...args) {
    this.service && args.unshift(this.service);
    console.log.apply(null, ["[DEBUG]"].concat(args));
  };
}