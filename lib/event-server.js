(function() {
  var EventEmitter, EventServer, S3Client, express, readData;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  EventEmitter = require('events').EventEmitter;
  express = require('express');
  readData = require('tafa-misc-util').readData;
  S3Client = require('aws-stuff').S3Client;
  EventServer = (function() {
    __extends(EventServer, EventEmitter);
    function EventServer(opt) {
      var app, cert, key;
      if (opt == null) {
        opt = {};
      }
      EventServer.__super__.constructor.call(this);
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
      return app.get('/', function(req, res, next) {
        return res.render('index');
      });
    };
    EventServer.prototype._processNewBatch = function(k, callback) {
      return this.bucket.get({
        k: k
      }, function(e, data) {
        if (e) {
          return callback(e);
        }
        console.log("*** got " + data.length + " bytes");
        return callback();
      });
    };
    return EventServer;
  })();
  module.exports = {
    EventServer: EventServer
  };
}).call(this);
