/// <reference types="node" />
import * as fs from 'fs';
declare type Callback<T = boolean | string> = (err: Error | null, resp?: T) => void;
declare function create(libFolderPath: string, data: string, callback: fs.NoParamCallback): void;
declare function read(libFolderPath: string, callback: Callback<Record<string, any>>): void;
declare function getLibraryPageWithChildren(libFolderPath: any, componentsWithChildren: Record<string, any>[], cb: Callback): void;
declare function saveComponents(libFolderPath: string, componentsWithChildren: Record<string, any>[], callback: Callback<void>, ignoreDeletion?: boolean): void;
declare const createLibDirFile: typeof create;
export { read, saveComponents, createLibDirFile, getLibraryPageWithChildren };
//# sourceMappingURL=index.d.ts.map