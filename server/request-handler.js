var dummyHTML = '<div>DUMMY PAGE</div>';

var storage = {
  classes: {
     messages: [{username:'test', text:'message'}]
    // messages: []
  }
};

var requestHandler = function(request, response) {

  console.log("Serving request type " + request.method + " for url " + request.url);

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
    console.log('empty');
    headers['Content-Type'] = "text/html";
    response.writeHead(200, headers);
    response.end(dummyHTML);

  //else return json request
  } else {
    response.end(result);
  }
};

function addPost(request, storage, room) {
  storage.classes[room] = (storage.classes[room] || []);
  var roomMsgs = storage.classes[room];
  var body = '';
  request.on('data', function(data) {
    body += data;
  });
  request.on('end', function() {
    var post = JSON.parse(body);
    console.log(post);
    roomMsgs.push(createMessage(post));
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

function createMessage(data) {
  data.createdAt = Date.now();
  return data;
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

