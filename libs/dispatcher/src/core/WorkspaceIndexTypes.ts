export type FileInfoType = {
  crc: number;
  date: string;
  fullPath?: string;
};

export type ProjectJSONType = {
  [key: string]: string | number;
  config: any;
  build: any;
  api: any;
  info: any;
  workspace: any;
  projectID?: string;
};

export type WorkspaceIndexType = ProjectJSONType & {
  files: FileInfoType[] | {};
};
