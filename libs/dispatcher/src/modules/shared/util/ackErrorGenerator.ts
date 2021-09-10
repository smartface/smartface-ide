import LogToConsole from '../LogToConsole';

export default function ackErrorGenerator(message: string) {
  return (errors: string[] | string | null, result?: any): void => {
    if (errors) {
      LogToConsole.instance.error('[ERROR]', message, errors);
    }
  };
}
