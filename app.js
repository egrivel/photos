
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
  } else if (url.indexOf('/phtest') === 0) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.writeHead(200);
    res.end(msg);
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
