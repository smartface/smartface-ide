export function convertCLIArgsToOpts(args) {
  const opts = {
    meta: { logToConsole: true, restart: false, v: false, bypassSecurityCheck: true},
    ports: { dispatcher: 8081},
	host: ''
  };

  opts.meta.logToConsole = !!args.logToConsole || !!args.logtoconsole || !!args.verbose;
  opts.meta.restart = !!args.restart;
  opts.meta.v = !!args.v;
  opts.meta.bypassSecurityCheck = !!args.bypasssecuritycheck || !!args.bypassSecurityCheck;
  if (args.port) {
    opts.ports.dispatcher = args.port;
  }
  opts.host = args.host;
  return opts;
}
