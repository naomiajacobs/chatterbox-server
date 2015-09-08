/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

var storage = {
  classes: {
    messages: []
  }
};

/*
  they do a get request for /classes/roomthatdoesntexistyet: 404
  they do a get request for room that does exist: 200
  they do a send request for room that doesnt exist: 200
*/

var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.

  console.log("Serving request type " + request.method + " for url " + request.url);

  var urlTokens = request.url.split('/');
  var directory = urlTokens[1];
  var room = urlTokens[2] || 'messages';

  // The outgoing status.
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
  /*if (!storage[directory]) {
    statusCode = 404;
  } else {
    if (request.method === 'GET') { statusCode = 200; }
    else if (request.method === 'POST') { statusCode = 201; }
    else if (request.method === 'OPTIONS') { statusCode = 200; }
    else { statusCode = 404; }
  }*/

  // we should totally make a helper fn that turns a request into a message object
  // push attributes to messages

  if (request.method === 'POST') {
    storage.classes[room] = (storage.classes[room] || []);
    var roomMsgs = storage.classes[room];
    var body = '';
    request.on('data', function(data) {
      body += data;
    });
    request.on('end', function() {
      var post = JSON.parse(body);
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
    results: storage.classes[room] || []
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

function createMessage(data) {
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
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

exports.requestHandler = requestHandler;

