// var dummyHTML = '<div>DUMMY PAGE</div>';
var fs = require('fs');

var storageModule = require('./storageModule.js');
var storage = storageModule.storage;

var requestHandler = function(request, response) {

  console.log("Serving request type " + request.method + " for url " + request.url);
  console.log(storage);

  //determine if sort parameters were passed in
  var hasParam = !! (request.url.indexOf('?')+1);
  if (hasParam) {
    var displayParams = request.url.substr(request.url.indexOf('?')+1);
    request.url = request.url.substr(0, request.url.indexOf('?'));
  }

  //tokenize url path to find data
  var urlTokens = request.url.split('/');
  var directory = urlTokens[1];
  var room = urlTokens[2] || 'messages';

  //find appropriate status code
  var statusCode = findStatusCode(request.method, storage, directory);

  //add post to storage
  if (request.method === 'POST') {
    addPost(request, storage, room);
  }

  //add headers and write head
  var headers = defaultCorsHeaders;
  headers['Content-Type'] = "application/json";
  response.writeHead(statusCode, headers);

  //build object to return; sort properly if necessary
  var newObj = {
    results: storage.classes[room] || [],
  }
  if (hasParam) {
    var param = displayParams.substr(0, displayParams.indexOf('='));
    var setting = displayParams.substr(displayParams.indexOf('=') + 1);
    newObj.results = sortResults(newObj.results, param, setting);
  }
  var result = JSON.stringify(newObj);

  //handle html requests
  if (request.url === "/") { 
    request.url = "/client/clientIndex.html";
  }
  request.url = '..'+request.url;
  var fileType = request.url.substr(request.url.lastIndexOf('.')+1);
  var acceptableFileTypes = ["html", "js", "json", "css"];
  var fileTypeHeaders = {
    html: "text/html",
    json: "application/json",
    js: "application/javascript",
    css: "text/css"
  }
  if (acceptableFileTypes.indexOf(fileType) !== -1) {
    headers['Content-Type'] = fileTypeHeaders[fileType];
    response.writeHead(200, headers);
    var indexHtml ="";
    fs.readFile(request.url, function(err, data) {
      if (err) { console.log('err: ', err); }
      indexHtml+=data;
      //console.log('idx: '+  indexHtml);
      response.end(indexHtml);
    });
  //else return json request
  } else {
    response.end(result);
  }
};

/*function getFile(localURL) {
  if (localURL === "/") { 
    localURL = "../client/clientIndex.html"; 

  }

  return file;
}*/

function addPost(request, storage, room) {
  var body = '';
  request.on('data', function(data) {
    body+=data;
  });
  request.on('end', function() {
    var post = JSON.parse(body);
    console.log('postlog', post);
    storageModule.addMessage(post, room);
  });
}

function findStatusCode(method, storage, directory) {
  var statusCode;
  if (method === 'OPTIONS') { statusCode = 200; }
  else if (method === 'POST') { statusCode = 201; }
  else if (method === 'GET') {
    if (!storage[directory]) {
      statusCode = 404;
    }
    else {
      statusCode = 200;
    }
  }
  return statusCode;
};

function sortResults(array, dummyparam, field) {
  var operator = 1;
  if (field.charAt(0) === '-') {
    field = field.substr(1);
    operator = -1;
  }
  return array.sort(function(a,b) {
    a = a[field]*operator;
    b = b[field]*operator;
    return a - b;
  });
};


// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept, X-Parse-Application-Id, X-Parse-REST-API-Key",
  "access-control-max-age": 10 // Seconds.
};

exports.requestHandler = requestHandler;

