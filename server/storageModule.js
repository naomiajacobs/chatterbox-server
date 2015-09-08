var fs = require('fs');

// attempt to read storage file
// if empty, do what we already have
var storage = {
  classes: {
    // messages: getMessages()
     messages: [{username:'test', text:'message'}]
    // messages: []
  }
};
getMessages();

function addMessage (post, room) {
  storage.classes[room] = (storage.classes[room] || []);
  var roomMsgs = storage.classes[room];
  roomMsgs.push(createMessage(post));
  fs.writeFile('storage.json', JSON.stringify(storage));
};

function createMessage(data) {
  data.createdAt = Date.now();
  return data;
};

function getMessages() {
  fs.readFile('storage.json', function(err, data) {
    if (err) {
      console.log('err: ', err);
    }
    else {
      storage = JSON.parse(data);
    }
  });
}

exports.storage = storage;
exports.addMessage = addMessage;