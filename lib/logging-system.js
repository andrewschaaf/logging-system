(function() {
  var DevServer, EventClient, createDevServer;
  DevServer = require('./dev-server').DevServer;
  EventClient = require('./client').EventClient;
  createDevServer = function(opt) {
    if (opt == null) {
      opt = {};
    }
    return new DevServer;
  };
  module.exports = {
    createDevServer: createDevServer,
    EventClient: EventClient
  };
}).call(this);
