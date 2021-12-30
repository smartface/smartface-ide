export type OSType = 'iOS' | 'Android';

export type DeviceInfoType = {
    "brandModel": string;
    "brandName": string;
    "deviceID": string;
    "deviceName": string;
    "os": OSType;
    "osVersion": string;
    "screen": {
        "pt": {
            "height": string;
            "width": string;
        },
        "px": {
            "height": string;
            "width": string;
        }
    },
    "screenDPI": string;
    "smartfaceVersion": string;
};

export type GetIndexCommandType = {
    "command": 'getIndex';
    "data": DeviceInfoType;
    "id": number
};

export type GetFilesCommandType = {
    "command": 'getFiles';
    "data": {
        "files": string[]
    },
    "id": number
}

export type ConsoleCommandType = {
    "command": string;
    "data": {
        "loggingLevel": string;
        "message": string;
        "time": string;
    },
    "id": number;
}

export type EmulatorCommandType = {
  command: string;
  data: {
    emulatorsCount: number;
    message?: string;
  };
  id: number;
};

export type FileSizeCommandType = {
    "command": 'fileSize';
    "data": { "size": number; }
    "id": number;
}

export type CommandResponseType = {
    "command": string;
    "data": Buffer | string;
    "id": number;
}

export type CommandType = GetIndexCommandType | GetFilesCommandType | ConsoleCommandType | EmulatorCommandType;