'use strict';

const http = require('http');
const https = require('https');
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
    var remoteIP = '173.64.127.170'; // '71.244.151.53'; // '108.40.126.176'; // '71.121.250.158';
    var remotePort = 4433;
    var remotePrefix = '/cgi-bin/photos';
    var options = {
      port: remotePort,
      host: remoteIP,
      method: req.method,
      path: remotePrefix + req.url,
      headers: req.headers
    };

    // We know that the target system (the home server) has a self-signed
    // certificate. The main point of using HTTPS here is to have an
    // encrypted communication channel to prevent eavesdropping. Turning
    // off the authorization probably allows a man-in-the-middle attack,
    // but we can live with that.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    var proxyRequest = https.request(options);
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
