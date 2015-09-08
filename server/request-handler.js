var storage = {
  classes: {
    messages: []
  }
};

var requestHandler = function(request, response) {

  console.log("Serving request type " + request.method + " for url " + request.url);


  // The outgoing status.

  var hasParam = !! (request.url.indexOf('?')+1);
  if (hasParam) {
    var displayParams = request.url.substr(request.url.indexOf('?')+1);
    request.url = request.url.substr(0, request.url.indexOf('?'));
    // what i wanted to do was put this way later so we could just go sortMsgs(param, setting)
  }
  var urlTokens = request.url.split('/');
  var directory = urlTokens[1];
  var room = urlTokens[2] || 'messages';

  // we should totally make a helper fn that turns a request into a message object
  // push attributes to messages
  var statusCode;
  if (request.method === 'OPTIONS') { statusCode = 200; }
  else if (request.method === 'POST') { statusCode = 201; }
  else if (request.method === 'GET') {
    if (!storage[directory]) {
      statusCode = 404;
    }
    else {
      statusCode = 200;
    }
  }
  // DEBUGGIN
  console.log(statusCode);

  if (request.method === 'POST') {
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

  // if (request.method === 'OPTIONS') {

  // }

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  // Tell the client we are sending them plain text.
  //
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.
  headers['Content-Type'] = "application/json";

  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  response.writeHead(statusCode, headers);

  // We are going to take our storage element, and turn it into a correct object to send back to the client
  var newObj = {
    // results: storage.messages
    // This is where we can handle logic such as only displaying some messages
    //results: storage.classes.messages
    results: storage.classes[room] || [],
  }
  if (hasParam) {
    var param = displayParams.substr(0, displayParams.indexOf('='));
    var setting = displayParams.substr(displayParams.indexOf('=') + 1);
    newObj.results = sortResults(newObj.results, param, setting);
  }
  var result = JSON.stringify(newObj);


  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.

  response.end(result);
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
}

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

