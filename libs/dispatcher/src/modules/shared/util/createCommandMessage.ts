import uuid = require('uuid');

export default function createCommandMessage(command, data) {
  return {
    id: uuid.v4(),
    command,
    data,
  };
}
