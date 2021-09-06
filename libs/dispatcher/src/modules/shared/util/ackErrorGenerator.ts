import LogToConsole from '../LogToConsole';

export default function ackErrorGenerator(message) {
  return function ack(error) {
    if (error) {
      LogToConsole.instance.error('[ERROR]', message, error);
    }
  };
}
