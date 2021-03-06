export const SERVICES = {
  CONTROL: 'control',
  FILE_TRANSFER: 'file-transfer',
  UI: 'UI',
};

export const ALLOWED_SERVICES = [SERVICES.CONTROL, SERVICES.FILE_TRANSFER, SERVICES.UI];

const CONSOLE_COMMANDS = ['console.log', 'console.error', 'console.info', 'console.warn'];

export function isAllowedConnection(service: string) {
  return ALLOWED_SERVICES.indexOf(service) !== -1;
}

export function isControlConnection(service: string) {
  return service === SERVICES.CONTROL;
}

export function isIDEConnection(service: string) {
  return service === SERVICES.UI;
}

export function isFileTransferConnection(service: string) {
  return service === SERVICES.FILE_TRANSFER;
}

export function isConsoleCommands(cmd: string) {
  return CONSOLE_COMMANDS.indexOf(cmd) !== -1;
}
