import { execFile } from 'child_process';
import path = require('path');
import fs = require('fs');

import gifFrames = require('gif-frames');
import gifsicle = require('gifsicle');
import { Express, Request, Response, NextFunction } from 'express';
import Jimp = require('jimp');

import { ConfigurationService } from '../shared/ConfigurationService';
import { mkdirpAsync } from '../shared/util/mkdirp';
import Workspace from '../shared/workspace/workspace';
import getRandomName from '../shared/util/getRandomName';
import LogToConsole from '../shared/LogToConsole';
import Device from '../shared/workspace/device';

const IMAGE_FORMAT = {
  png: Jimp.MIME_PNG || 'image/png',
};

export default function createImageApi(app: Express, options: any = {}) {
  const wsPath = ConfigurationService.instance.getWorkspacePath();
  const tempPath = ConfigurationService.instance.getTempPath();
  const logger = LogToConsole.instance;
  logger.log('image serving ready...');
  app.get(
    ConfigurationService.baseImageServePath + '/:imageName',
    async (req: Request, res: Response, next: NextFunction) => {
      let device: Device = new Device({
        resourceFolderOrder: _ => _,
        os: req.query.os,
        screen: {
          dp: req.query.density,
        },
        brandModel: req.query.brandModel,
      });
      let densityRatio = req.query.densityRatio || 1;
      try {
        if (req.query.resourceFolderOrder) {
          var resourceFolderOrder = (req.query.resourceFolderOrder as string).split(',');
          for (var i = 0; i < resourceFolderOrder.length; i++) {
            resourceFolderOrder[i] = '"' + resourceFolderOrder[i] + '"';
          }
          var functionBody = 'return [' + resourceFolderOrder + '];';
          var fn = new Function(functionBody);
          device.resourceFolderOrder = fn();
        }
      } catch (ex) {
        debugger;
      }

      var zoomLevel = Number(req.query.zoomLevel) || 1;
      var ws = new Workspace({
        path: wsPath,
      });
      var imageName = req.params.imageName;
      var imageFormat = getImageFormat(imageName);
      try {
        if (imageFormat === 'gif')
          serveGifImage(
            req.query,
            path.join(wsPath, 'assets', imageName),
            densityRatio,
            zoomLevel,
            res
          );
        else if (imageName !== '*') {
          const index = await ws.getImage(device, req.params.imageName);
          var found = !!(index && Object.keys(index) && Object.keys(index)[0]);
          if (found) {
            var filePath = Object.keys(index)[0];
            //var fileInfo = index[filePath];
            sendImageBuffer(filePath, densityRatio, zoomLevel, imageFormat, res);
          } else {
            res.sendStatus(404);
          }
        } else {
          const index = await ws.getImage(device, req.params.imageName, false);
          var result = {};
          for (var p in index) {
            var item = index[p];
            item.path = p;
            var parsedPath = path.parse(p);
            var key = parsedPath.name.split('@')[0] + parsedPath.ext;
            result[key] = item;
          }
          res.json(result);
        }
      } catch (err) {
        if (err) return handleError(err, res);
      }
    }
  );

  function serveGifImage(query, filePath, densityRatio, zoomLevel, response) {
    let tempGifFile = path.join(tempPath, getRandomName('.gif'));
    mkdirpAsync(tempPath).then(() => {});
    execFile(gifsicle, ['--scale', zoomLevel, '-o', tempGifFile, filePath], err => {
      if (err) return handleError(err, response);
      if (query.frame !== undefined) {
        gifFrames({ url: tempGifFile, frames: query.frame, utputType: 'png' }).then(function(
          frameData
        ) {
          //response.writeHead(200, { 'Content-Type': 'image/png' });
          let readable = frameData[0].getImage();
          response.contentType('image/png');
          readable.pipe(response);
          fs.unlink(tempGifFile, _ => _);
        });
      } else {
        fs.readFile(tempGifFile, (err, data) => {
          if (err) return handleError(err, response);
          sendData(data, 'gif', response);
          fs.unlink(tempGifFile, _ => _);
        });
      }
    });
  }

  function sendImageBuffer(source, densityRatio, zoomLevel, imageFormat, response) {
    Jimp.read(source, function(err, image) {
      if (err) return handleError(err, response);
      image.scale(densityRatio * zoomLevel /** fileInfo.scaleWith*/, function(err, image) {
        if (err) return handleError(err, response);
        image.getBuffer(IMAGE_FORMAT[imageFormat] || Jimp.AUTO, function(err, buffer) {
          if (err) return handleError(err, response);
          sendData(buffer, imageFormat, response);
        });
      });
    });
  }

  function sendData(data, imageFormat, response) {
    response
      .type(imageFormat)
      .set({
        'Pragma-directive': 'no-cache',
        'Cache-directive': 'no-cache',
        'Cache-control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
      })
      .send(data);
  }

  function getImageFormat(filePath) {
    return path
      .parse(filePath)
      .ext.substr(1)
      .toLowerCase();
  }

  function handleError(err, response) {
    response.sendStatus(500);
    response.end(err.stack || err);
    logger.log('[ERROR]', err);
  }
}
