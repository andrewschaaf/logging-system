(function() {
  var EventEmitter, LoggingServer, REQ_DATA_EVENT, REQ_END_EVENT, http, https, intervalSet, joinBuffers, pack, postToS3, randomToken, strftime, unpack, _createServer, _encodeRequestData, _encodeRequestEnd, _ref, _ref2;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  http = require('http');
  https = require('https');
  EventEmitter = require('events').EventEmitter;
  strftime = require('strftime');
  _ref = require('msgpack2'), pack = _ref.pack, unpack = _ref.unpack;
  postToS3 = require('s3-post').postToS3;
  _ref2 = require('tafa-misc-util'), randomToken = _ref2.randomToken, joinBuffers = _ref2.joinBuffers, intervalSet = _ref2.intervalSet;
  LoggingServer = (function() {
    __extends(LoggingServer, EventEmitter);
    function LoggingServer(_arg) {
      var cert, key;
      this.batchSeconds = _arg.batchSeconds, this.saveEmptyBatches = _arg.saveEmptyBatches, this.s3 = _arg.s3, key = _arg.key, cert = _arg.cert;
      LoggingServer.__super__.constructor.call(this);
      this.batchSeconds || (this.batchSeconds = 10);
      this.saveEmptyBatches || (this.saveEmptyBatches = false);
      this.reqCounter = 0;
      this.serverToken = randomToken(8);
      this.nextBatch = [];
      this.batchNumber = 1;
      this.server = _createServer(key, cert, (__bind(function(req, res) {
        return this.handleRequest(req, res);
      }, this)));
      intervalSet(this.batchSeconds * 1000, __bind(function() {
        return this._saveBatch();
      }, this));
    }
    LoggingServer.prototype.listen = function(port, callback) {
      if (callback == null) {
        callback = (function() {});
      }
      return this.server.listen(port, callback);
    };
    LoggingServer.prototype.handleRequest = function(req, res) {
      var reqId;
      reqId = this._nextReqId();
      req.on('data', __bind(function(data) {
        var t;
        t = new Date().getTime();
        return this._save(_encodeRequestData(t, reqId, req, data));
      }, this));
      return req.on('end', __bind(function() {
        var t;
        t = new Date().getTime();
        this._save(_encodeRequestEnd(t, reqId, req));
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });
        return res.end("OK\n");
      }, this));
    };
    LoggingServer.prototype._save = function(data) {
      return this.nextBatch.push(data);
    };
    LoggingServer.prototype._nextReqId = function() {
      this.reqCounter++;
      return this.reqCounter;
    };
    LoggingServer.prototype._saveBatch = function() {
      var data, datePart;
      if (this.saveEmptyBatches || this.nextBatch.length > 0) {
        data = joinBuffers(this.nextBatch);
        datePart = strftime.strftimeUTC("%Y-%m-%d/%H-%M-%S-%L-Z");
        this.s3.key = ("v1/" + datePart + "-") + this.serverToken + "-" + randomToken(8) + "-" + this.batchNumber;
        this.s3.data = data;
        postToS3(this.s3, __bind(function(e) {
          if (!e) {
            return this.emit('batch-saved', {
              key: this.s3.key
            });
          }
        }, this));
        delete this.s3.data;
        this.nextBatch = [];
        return this.batchNumber++;
      }
    };
    return LoggingServer;
  })();
  _createServer = function(key, cert, handler) {
    if (key && cert) {
      return https.createServer({
        key: key,
        cert: cert
      }, handler);
    } else {
      return http.createServer(handler);
    }
  };
  REQ_DATA_EVENT = 1;
  REQ_END_EVENT = 2;
  _encodeRequestData = function(t, reqId, req, data) {
    return pack({
      1: REQ_DATA_EVENT,
      2: reqId,
      3: t,
      4: data
    });
  };
  _encodeRequestEnd = function(t, reqId, req) {
    var contentType, remoteIp;
    remoteIp = req.headers['x-forwarded-for'];
    contentType = req.headers['content-type'];
    return pack({
      1: REQ_END_EVENT,
      2: reqId,
      3: t,
      5: remoteIp ? new Buffer(remoteIp, 'utf-8') : null,
      6: contentType ? new Buffer(contentType, 'utf-8') : null,
      7: new Buffer(req.url)
    });
  };
  module.exports = {
    LoggingServer: LoggingServer
  };
}).call(this);
