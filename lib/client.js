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
        this.port = 80;
      } else if (parsed.protocol === 'https:') {
        this.httpHandler = https;
        this.port = 443;
      } else {
        throw new Error('URL must include "http:" or "https:"');
      }
      this.host = parsed.hostname;
      if (parsed.port) {
        this.port = parsed.port;
      }
    }
    EventClient.prototype.resetServer = function(callback) {
      var opt;
      if (callback == null) {
        callback = (function() {});
      }
      opt = {
        host: this.host,
        port: this.port,
        path: "/reset"
      };
      return this.httpHandler.get(opt, __bind(function(res) {
        return callback();
      }, this));
    };
    EventClient.prototype.log = function(x, y) {
      var data, i, info, opt, req, t;
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
      opt = {
        method: 'POST',
        host: this.host,
        port: this.port,
        path: "/api/post-events",
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      req = this.httpHandler.request(opt, __bind(function(res) {}, this));
      return req.end(data);
    };
    return EventClient;
  })();
  module.exports = {
    EventClient: EventClient
  };
}).call(this);
