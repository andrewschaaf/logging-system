(function() {
  var DevServer, express, readData, reversed, xmlEscape, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty;
  express = require('express');
  _ref = require('tafa-misc-util'), readData = _ref.readData, reversed = _ref.reversed, xmlEscape = _ref.xmlEscape;
  DevServer = (function() {
    function DevServer() {
      var app, port;
      this.events = [];
      this.counter = 0;
      app = this.app = express.createServer(express.logger());
      app.set('views', "" + __dirname + "/../views");
      app.set('view engine', 'jade');
      app.use(app.router);
      app.use(express.static("" + __dirname + "/../public"));
      app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
      }));
      this.initApp(app);
      port = process.env.PORT || 7007;
      app.listen(port, __bind(function() {
        return console.log("Listening on " + port + "...");
      }, this));
    }
    DevServer.prototype.initApp = function(app) {
      app.get('/', __bind(function(req, res, next) {
        return res.render('index', {
          locals: {
            events: reversed(this.events)
          }
        });
      }, this));
      app.get('/events.json', __bind(function(req, res, next) {
        res.writeHead(200, {
          'Content-Type': 'text/javascript'
        });
        return res.end(new Buffer(JSON.stringify({
          events: this.events
        })));
      }, this));
      app.get('/reset', __bind(function(req, res, next) {
        console.log('*** RESET ***');
        this.events = [];
        this.counter = 0;
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });
        return res.end('OK');
      }, this));
      return app.post('/api/post-events', __bind(function(req, res, next) {
        return readData(req, __bind(function(data) {
          var e, events, k, v, v_html, _i, _len;
          console.log('------------------');
          console.log(data.toString());
          console.log('------------------');
          events = JSON.parse(data.toString()).events;
          for (_i = 0, _len = events.length; _i < _len; _i++) {
            e = events[_i];
            this.counter++;
            if (!e.k) {
              e.k = [new Date().getTime(), this.counter];
            }
            e.items = (function() {
              var _results;
              _results = [];
              for (k in e) {
                if (!__hasProp.call(e, k)) continue;
                v = e[k];
                v_html = "<pre>" + (xmlEscape(JSON.stringify(v, null, 2))) + "</pre>";
                _results.push([k, v_html]);
              }
              return _results;
            })();
            e.items.sort();
            this.events.push(e);
          }
          res.writeHead(200, {
            'Content-Type': 'text/plain'
          });
          return res.end('OK');
        }, this));
      }, this));
    };
    return DevServer;
  })();
  module.exports = {
    DevServer: DevServer
  };
}).call(this);
