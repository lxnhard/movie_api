const http = require('http');
const url = require('url');
const fs = require('fs');

http.createServer((request, response) => {
  let reqURL = request.url;
  let q = url.parse(reqURL, true);
  let filePath = '';

  // Log
  fs.appendFile('log.txt', 'URL: ' + reqURL + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Added to log.');
    }
  });

  // Check if documentation or other URL
  if (q.pathname.includes('documentation')) {
    filePath = 'documentation.html';
  } else {
    filePath = 'index.html';
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      throw err;
    }
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(data);
    response.end();
  });
}).listen(8080);

console.log('My first Node test server is running on Port 8080.');
