import WebSocket = require("ws");

export function resolveMessage(message: any){

}

abstract class Command<TResult=any> {
  abstract execute(): Promise<TResult>;
}

class GetIndexCommand implements Command<any[]> {
  async execute(){
    return [];
  }
}