(function() {
  var EventClient, http, https, url;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  http = require('http');
  https = require('https');
  url = require('url');
  EventClient = (function() {
    function EventClient(opt) {
      var parsed;
      parsed = url.parse(opt.url);
      this.counter = 0;
      if (parsed.protocol === 'http:') {
        this.httpHandler = http;
      } else if (parsed.protocol === 'https:') {
        this.httpHandler = https;
      } else {
        throw new Error('URL must include "http:" or "https:"');
      }
      this.httpOpt = {
        method: 'POST',
        host: parsed.hostname,
        path: "/api/post-events",
        headers: {
          'Content-Type': 'application/json'
        }
      };
      if (parsed.port) {
        this.httpOpt.port = parsed.port;
      }
      console.log(JSON.stringify(this.httpOpt));
    }
    EventClient.prototype.log = function(x, y) {
      var data, i, info, req, t;
      t = new Date().getTime();
      this.counter++;
      i = this.counter;
      info = y ? {
        type: x,
        v: y
      } : x;
      if (!info.k) {
        info.k = [t, i];
      }
      data = new Buffer(JSON.stringify({
        events: [info]
      }));
      this.httpOpt.headers['Content-Length'] = data.length;
      req = this.httpHandler.request(this.httpOpt, __bind(function(res) {}, this));
      return req.end(data);
    };
    return EventClient;
  })();
  module.exports = {
    EventClient: EventClient
  };
}).call(this);
