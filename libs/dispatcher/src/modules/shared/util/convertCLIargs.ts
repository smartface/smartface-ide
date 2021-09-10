import { ConfigurationPaths } from "../ConfigurationService";

export function convertCLIArgsToOpts(args: ConfigurationPaths ) {
  const opts = {
    logToConsole: true, restart: false, v: false, bypassSecurityCheck: true,
    ports: { dispatcher: 8081 },
    host: ''
  };

  opts.logToConsole = !!args.logToConsole || !!args.logtoconsole || !!args.verbose;
  opts.restart = !!args.restart;
  opts.v = !!args.v;
  opts.bypassSecurityCheck = !!args.bypasssecuritycheck || !!args.bypassSecurityCheck;
  if (args.port) {
    opts.ports.dispatcher = args.port;
  }
  opts.host = args.host;
  return opts;
}
