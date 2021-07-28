const uuid = require('uuid');

function MessageFactory() {
    if (!(this instanceof MessageFactory))
        return new MessageFactory();

    this.createMessage = function(command, data) {
        var message = {
            "id": generateGUID(),
            "command": command
        };
        data && (message.data = data);
        return message;
    };

    function generateGUID() {
        return uuid.v4();
    }
}

module.exports = MessageFactory;
