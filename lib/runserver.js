(function() {
  var EventServer, port, s;
  EventServer = require('./event-server').EventServer;
  port = require('optimist').argv.port;
  if (port) {
    port = parseInt(port, 10);
  } else {
    port = 7007;
  }
  s = new EventServer({
    verbose: true
  });
  s.listen(port, function() {
    return console.log("Listening on " + port + "...");
  });
}).call(this);
