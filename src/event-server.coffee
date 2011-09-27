
{EventEmitter} = require 'events'
express = require 'express'
{pack, unpack} = require 'msgpack2'
{readData} = require 'tafa-misc-util'
{S3Client} = require 'aws-stuff'


class EventServer extends EventEmitter
  constructor: (opt={}) ->
    
    super()
    
    if opt.s3
      @bucket = new S3Client opt.s3
    
    {key, cert} = opt
    if key and cert
      app = express.createServer {key:key, cert:cert}, express.logger()
    else
      app = express.createServer express.logger()
    @app = app
    app.set 'views', "#{__dirname}/../views"
    app.set 'view engine', 'jade'
    app.use app.router
    app.use express.static "#{__dirname}/../public"
    app.use express.errorHandler {dumpExceptions: true, showStack: true}
    @initApp app
  
  listen: (port, callback=(->)) ->
    @app.listen port, () =>
      callback()
  
  initApp: (app) ->
    
    app.get '/', (req, res, next) ->
      res.render 'index'
  
  _processNewBatch: (k, callback) ->
    @bucket.get k:k, (e, data) ->
      return callback e if e
      
      while data
        
        # read http_event
        size = unpack data
        data = data.slice pack(size).length # ASSUMPTION!
        http_event = unpack data
        if data.length <= size
          data = null
        else
          data = data.slice size
        
        # TODO process http_event
      
      callback()


module.exports =
  EventServer: EventServer
