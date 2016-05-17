'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const contentTypes = require('./utils/content-types');
const sysInfo = require('./utils/sys-info');
const env = process.env;

var Curl = require('node-libcurl').Curl;

let server = http.createServer(function(req, res) {
  let url = req.url;
  if (url === '/') {
    url += 'index.html';
  }

  var msg = '<h1>See if this works</h1><p>Got the URL \'' + url + '\'</p>';
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
    console.log('static file ' + url);
    fs.readFile('./static' + url, function(err, data) {
      if (err) {
        res.writeHead(404);
        res.end();
      } else {
        let ext = path.extname(url).slice(1);
        console.log('Got extension ' + ext + ', content type ' +
          contentTypes[ext]);
        res.setHeader('Content-Type', contentTypes[ext]);
        if (ext === 'html') {
          res.setHeader('Cache-Control', 'no-cache, no-store');
        }
        res.end(data);
      }
    });
    console.log('--> done static file ' + url);
  } else if (url.indexOf('/ph') === 0) {
    console.log('forwarding url ' + url);
    var remoteUrl = 'http://173.64.119.113:31415/cgi-bin/photos' + url;
    var curl = new Curl();
    curl.setOpt('URL', remoteUrl);
    curl.setOpt('FOLLOWLOCATION', true);
    curl.on('end', function(statusCode, body, headers) {
      msg = '<h1>Photo URL found</h1>';
      msg += '<p>Translate this to call ' + remoteUrl + '</p>';
      msg += '<ul>';
      for (var key in headers[0]) {
        if (!headers[0].hasOwnProperty(key)) {
          continue;
        }
        if (key === 'result') {
          continue;
        }
        res.setHeader(key, headers[0][key]);
        msg += '<li>' + key + ': ' + JSON.stringify(headers[0][key]) + '</li>';
      }
      msg += '</ul>';
      msg += '<p>headers: ' + JSON.stringify(headers) + '</p>';
      // res.setHeader('Content-Type', 'text/html');
      // res.setHeader('Cache-Control', 'no-cache, no-store');
      res.writeHead(statusCode);
      res.end(body);
      console.log('done success forwarding url ' + url);
      console.log(msg);
      console.log('body length is ' + body.length);
    });
    curl.on('error', function(statusCode, headers) {
      msg = '<h1>Error connecting</h1>';
      msg += '<p>Translate this to call ' + remoteUrl + '</p>';
      msg += '<p>status code: ' + statusCode + '</p>';
      msg += '<p>headers: ' + JSON.stringify(headers) + '</p>';
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-cache, no-store');
      res.writeHead(200);
      res.end(msg);
      curl.close.bind(curl);
      console.log('done error forwarding url ' + url);
    });
    curl.perform();
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
