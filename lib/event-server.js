(function() {
  var CLIENT_TIME_INDEX, EVENTS, EVENT_CLIENT_TIME, EVENT_SERVER_TIME, EVENT_TYPE, EVENT_VALUE, EventEmitter, EventServer, HTTPEVENT_CONTENTTYPE, HTTPEVENT_DATA, HTTPEVENT_FRAGMENTID, HTTPEVENT_REMOTEIP, HTTPEVENT_REQID, HTTPEVENT_T, HTTPEVENT_TYPE, HTTPEVENT_TYPE__DATA, HTTPEVENT_TYPE__END, HTTPEVENT_URL, INDEXED_EVENTS, JVR, MockKVR, S3Client, assert, endswith, express, keyjson, keysOf, pack, readData, reversed, startswith, unpack, url, xmlEscape, _ref, _ref2, _ref3;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  url = require('url');
  assert = require('assert');
  EventEmitter = require('events').EventEmitter;
  express = require('express');
  _ref = require('msgpack2'), pack = _ref.pack, unpack = _ref.unpack;
  _ref2 = require('tafa-misc-util'), readData = _ref2.readData, reversed = _ref2.reversed, xmlEscape = _ref2.xmlEscape, startswith = _ref2.startswith, endswith = _ref2.endswith, keysOf = _ref2.keysOf;
  S3Client = require('aws-stuff').S3Client;
  keyjson = require('keyjson');
  _ref3 = require('datastores'), JVR = _ref3.JVR, MockKVR = _ref3.MockKVR;
  EVENTS = 1;
  INDEXED_EVENTS = 2;
  CLIENT_TIME_INDEX = 1;
  HTTPEVENT_TYPE__DATA = 1;
  HTTPEVENT_TYPE__END = 2;
  HTTPEVENT_TYPE = 1;
  HTTPEVENT_REQID = 2;
  HTTPEVENT_T = 3;
  HTTPEVENT_DATA = 4;
  HTTPEVENT_REMOTEIP = 5;
  HTTPEVENT_CONTENTTYPE = 6;
  HTTPEVENT_URL = 7;
  HTTPEVENT_FRAGMENTID = 8;
  EVENT_TYPE = 1;
  EVENT_VALUE = 2;
  EVENT_CLIENT_TIME = 3;
  EVENT_SERVER_TIME = 4;
  EventServer = (function() {
    __extends(EventServer, EventEmitter);
    function EventServer(opt) {
      var app, cert, key;
      if (opt == null) {
        opt = {
          verbose: this.verbose
        };
      }
      EventServer.__super__.constructor.call(this);
      this.buckets = {};
      this.events = [];
      this.jvr = new JVR(new MockKVR());
      if (opt.s3) {
        this.bucket = new S3Client(opt.s3);
      }
      key = opt.key, cert = opt.cert;
      if (key && cert) {
        app = express.createServer({
          key: key,
          cert: cert
        }, express.logger());
      } else {
        app = express.createServer(express.logger());
      }
      this.app = app;
      app.set('views', "" + __dirname + "/../views");
      app.set('view engine', 'jade');
      app.use(app.router);
      app.use(express.static("" + __dirname + "/../public"));
      app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
      }));
      this.initApp(app);
    }
    EventServer.prototype.listen = function(port, callback) {
      if (callback == null) {
        callback = (function() {});
      }
      return this.app.listen(port, __bind(function() {
        return callback();
      }, this));
    };
    EventServer.prototype.initApp = function(app) {
      app.get('/', __bind(function(req, res, next) {
        return res.render('index', {
          locals: {
            buckets: keysOf(this.buckets)
          }
        });
      }, this));
      app.get('/events', __bind(function(req, res, next) {
        var bucket, query;
        query = url.parse(req.url, true).query;
        bucket = query.bucket || null;
        return res.render('events', {
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
        this.events = [];
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });
        return res.end('OK');
      }, this));
      return app.post('/api/post-events', __bind(function(req, res, next) {
        var bucket, query, t;
        t = new Date().getTime();
        assert.equal(req.headers['content-type'], 'application/json');
        query = url.parse(req.url, true).query;
        bucket = query.bucket || null;
        return readData(req, __bind(function(data) {
          var events;
          events = JSON.parse(data.toString()).events;
          this._postEvents(t, bucket, events);
          res.writeHead(200, {
            'Content-Type': 'text/plain'
          });
          return res.end('KTHX');
        }, this));
      }, this));
    };
    EventServer.prototype._postEvents = function(t, bucket, events) {
      var d, event, eventData, k, k_ct, v, v_html, _i, _len, _results;
      this.buckets[JSON.stringify(bucket)] = true;
      _results = [];
      for (_i = 0, _len = events.length; _i < _len; _i++) {
        event = events[_i];
        event.items = (function() {
          var _results2;
          _results2 = [];
          for (k in event) {
            if (!__hasProp.call(event, k)) continue;
            v = event[k];
            v_html = "<pre>" + (xmlEscape(JSON.stringify(v, null, 2))) + "</pre>";
            _results2.push([k, v_html]);
          }
          return _results2;
        })();
        this.events.push(event);
        d = {};
        d[EVENT_TYPE] = event.type;
        d[EVENT_VALUE] = JSON.stringify(event.value);
        d[EVENT_CLIENT_TIME] = event.clientTime;
        d[EVENT_SERVER_TIME] = t;
        eventData = pack(d);
        k = [EVENTS, bucket, JSON.stringify(event.key)];
        k_ct = [INDEXED_EVENTS, bucket, CLIENT_TIME_INDEX, event.clientTime];
        if (this.verbose) {
          console.log("event: " + (keyjson.stringify(k).length) + "-byte k, " + (keyjson.stringify(k_ct).length) + "-byte k_ct, " + eventData.length + "-byte eventData");
        }
        this.jvr.set(k, eventData, function() {});
        _results.push(this.jvr.set(k_ct, eventData, function() {}));
      }
      return _results;
    };
    EventServer.prototype._processNewBatch = function(k, callback) {
      assert.ok(endswith(k, "v2"));
      return this.bucket.get({
        k: k
      }, __bind(function(e, data) {
        var body, bodyFragments, bucket, contentType, events, http_event, pathname, query, reqId, reqUrl, size, t, type, _ref4;
        if (e) {
          return callback(e);
        }
        bodyFragments = {};
        while (data) {
          size = unpack(data);
          data = data.slice(pack(size).length);
          http_event = unpack(data);
          if (data.length <= size) {
            data = null;
          } else {
            data = data.slice(size);
          }
          reqId = http_event[HTTPEVENT_REQID];
          type = http_event[HTTPEVENT_TYPE];
          t = http_event[HTTPEVENT_T] || null;
          if (!bodyFragments[reqId]) {
            bodyFragments[reqId] = [];
          }
          if (type === HTTPEVENT_TYPE__DATA) {
            bodyFragments[reqId].push(http_event[HTTPEVENT_DATA]);
          } else if (type === HTTPEVENT_TYPE__END) {
            contentType = http_event[HTTPEVENT_CONTENTTYPE];
            reqUrl = http_event[HTTPEVENT_URL];
            _ref4 = url.parse(reqUrl, true), pathname = _ref4.pathname, query = _ref4.query;
            bucket = query.bucket || null;
            body = bodyFragments[reqId].join('');
            if (this.verbose) {
              console.log("[http end] " + contentType + " " + reqUrl);
            }
            if (contentType === 'application/json' && pathname === "/api/post-events") {
              events = JSON.parse(body).events;
              this._postEvents(t, bucket, events);
            }
          }
        }
        return callback();
      }, this));
    };
    return EventServer;
  })();
  module.exports = {
    EventServer: EventServer
  };
}).call(this);
