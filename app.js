'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const contentTypes = require('./utils/content-types');
const sysInfo = require('./utils/sys-info');
const env = process.env;

let server = http.createServer(function(req, res) {
  let url = req.url;
  if (url === '/') {
    url += 'index.html';
  }

  // IMPORTANT: Your application HAS to respond to GET /health with status 200
  //            for OpenShift health monitoring
  if (url === '/health') {
    res.writeHead(200);
    res.end();
  } else if (url.indexOf('/info/') === 0) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.end(JSON.stringify(sysInfo[url.slice(6)]()));
  } else if (url.indexOf('/photos') === 0) {
    fs.readFile('./static' + url, function(err, data) {
      if (err) {
        res.writeHead(404);
        res.end();
      } else {
        let ext = path.extname(url).slice(1);
        res.setHeader('Content-Type', contentTypes[ext]);
        if (ext === 'html') {
          res.setHeader('Cache-Control', 'no-cache, no-store');
        }
        res.end(data);
      }
    });
  } else if (url.indexOf('/ph') === 0) {
    var remoteIP = '173.64.119.113';
    var remotePort = 31415;
    var remotePrefix = '/cgi-bin/photos';
    var options = {
      port: remotePort,
      host: remoteIP,
      methop: req.method,
      path: remotePrefix + req.url,
      headers: req.headers
    };

    var proxyRequest = http.request(options);
    proxyRequest.addListener('response', function(proxyResponse) {
      proxyResponse.addListener('data', function(chunk) {
        res.write(chunk, 'binary');
      });
      proxyResponse.addListener('end', function() {
        res.end();
      });
      res.writeHead(proxyResponse.statusCode, proxyResponse.headers);
    });
    req.addListener('data', function(chunk) {
      proxyRequest.write(chunk, 'binary');
    });
    req.addListener('end', function() {
      proxyRequest.end();
    });
  } else {
    fs.readFile('./static' + url, function(err, data) {
      if (err) {
        res.writeHead(404);
        res.end();
      } else {
        let ext = path.extname(url).slice(1);
        res.setHeader('Content-Type', contentTypes[ext]);
        if (ext === 'html') {
          res.setHeader('Cache-Control', 'no-cache, no-store');
        }
        res.end(data);
      }
    });
  }
});

server.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function() {
  console.log(`Application worker ${process.pid} started...`);
});
