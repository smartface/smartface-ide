import uuid = require('uuid');
import { CommandResponseType } from '../../../core/CommandTypes';

export default function createCommandMessage(command, data): CommandResponseType {
    return {
        id: uuid.v4(),
        command,
        data,
    };
}
