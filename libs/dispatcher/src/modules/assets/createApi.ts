import { Express } from "express";
import express = require("express");
import { join } from "path";
import { ConfigurationService } from "../shared/ConfigurationService";
import LogToConsole from "../shared/LogToConsole";


export default function createApi(app: Express) {
  LogToConsole.instance.log('file serving ready...');
  app.use('/files', express.static(join(ConfigurationService.instance.getWorkspacePath())));
}
