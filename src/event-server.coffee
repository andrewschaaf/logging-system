
url = require 'url'
assert = require 'assert'
{EventEmitter} = require 'events'

express = require 'express'
{pack, unpack} = require 'msgpack2'
{readData, reversed, xmlEscape, startswith, endswith, keysOf} = require 'tafa-misc-util'
{S3Client} = require 'aws-stuff'
keyjson = require 'keyjson'
{JVR, MockKVR} = require 'datastores'


EVENTS = 1
INDEXED_EVENTS = 2
CLIENT_TIME_INDEX = 1

HTTPEVENT_TYPE__DATA  = 1
HTTPEVENT_TYPE__END   = 2

HTTPEVENT_TYPE        = 1
HTTPEVENT_REQID       = 2
HTTPEVENT_T           = 3
HTTPEVENT_DATA        = 4
HTTPEVENT_REMOTEIP    = 5
HTTPEVENT_CONTENTTYPE = 6
HTTPEVENT_URL         = 7
HTTPEVENT_FRAGMENTID  = 8

EVENT_TYPE = 1
EVENT_VALUE = 2
EVENT_CLIENT_TIME = 3
EVENT_SERVER_TIME = 4


class EventServer extends EventEmitter
  constructor: (opt={@verbose}) ->
    
    super()
    
    @buckets = {}
    @events = []
    
    @jvr = new JVR(new MockKVR())
    
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
    
    app.get '/', (req, res, next) =>
      res.render 'index', locals:
        buckets: keysOf @buckets
    
    app.get '/events', (req, res, next) =>
      {query} = url.parse req.url, true
      bucket = query.bucket or null
      res.render 'events', locals:
        events: reversed @events
    
    app.get '/events.json', (req, res, next) =>
      res.writeHead 200, {'Content-Type': 'text/javascript'}
      # TODO buckets param
      # TODO from DB, not temp hack
      res.end new Buffer JSON.stringify {
        events: @events
      }
    
    app.get '/reset', (req, res, next) =>
      # TODO reset db
      @events = []
      res.writeHead 200, {'Content-Type': 'text/plain'}
      res.end 'OK'
    
    app.post '/api/post-events', (req, res, next) =>
      t = new Date().getTime()
      assert.equal req.headers['content-type'], 'application/json'
      {query} = url.parse req.url, true
      bucket = query.bucket or null
      readData req, (data) =>
        {events} = JSON.parse data.toString()
        @_postEvents t, bucket, events
        res.writeHead 200, 'Content-Type':'text/plain'
        res.end 'KTHX'
  
  _postEvents: (t, bucket, events) ->
    @buckets[JSON.stringify bucket] = true
    for event in events
      
      # TEMP
      event.items = for own k, v of event
        v_html = "<pre>#{xmlEscape JSON.stringify v, null, 2}</pre>"
        [k, v_html]
      @events.push event
      
      d = {}
      d[EVENT_TYPE] = event.type
      d[EVENT_VALUE] = JSON.stringify event.value
      d[EVENT_CLIENT_TIME] = event.clientTime
      d[EVENT_SERVER_TIME] = t
      eventData = pack d
      k     = [EVENTS, bucket, JSON.stringify(event.key)]
      k_ct  = [INDEXED_EVENTS, bucket, CLIENT_TIME_INDEX, event.clientTime]
      console.log "event: #{keyjson.stringify(k).length}-byte k, #{keyjson.stringify(k_ct).length}-byte k_ct, #{eventData.length}-byte eventData" if @verbose
      @jvr.set k, eventData, () ->
      @jvr.set k_ct, eventData, () -> 
  
  _processNewBatch: (k, callback) ->
    assert.ok endswith k, "v2"
    @bucket.get k:k, (e, data) =>
      return callback e if e
      
      bodyFragments = {}
      
      while data
        
        # read http_event
        size = unpack data
        data = data.slice pack(size).length # ASSUMPTION!
        http_event = unpack data
        if data.length <= size
          data = null
        else
          data = data.slice size
        
        reqId       = http_event[HTTPEVENT_REQID]
        type        = http_event[HTTPEVENT_TYPE]
        t           = http_event[HTTPEVENT_T] or null
        
        if not bodyFragments[reqId]
          bodyFragments[reqId] = []
        
        if type == HTTPEVENT_TYPE__DATA
          bodyFragments[reqId].push http_event[HTTPEVENT_DATA]
        
        else if type == HTTPEVENT_TYPE__END
          
          contentType = http_event[HTTPEVENT_CONTENTTYPE]
          reqUrl = http_event[HTTPEVENT_URL]
          {pathname, query} = url.parse reqUrl, true
          bucket = query.bucket or null
          
          body = bodyFragments[reqId].join ''
          console.log "[http end] #{contentType} #{reqUrl}" if @verbose
          if contentType == 'application/json' and pathname == "/api/post-events"
            {events} = JSON.parse body
            @_postEvents t, bucket, events
      
      callback()


module.exports =
  EventServer: EventServer
