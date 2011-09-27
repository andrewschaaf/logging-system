
http = require 'http'
https = require 'https'
{EventEmitter} = require 'events'
strftime = require 'strftime'
{pack, unpack} = require 'msgpack2'
{postToS3} = require 's3-post'
{randomToken, joinBuffers, intervalSet} = require 'tafa-misc-util'


class LoggingServer extends EventEmitter
  constructor: ({@batchSeconds, @saveEmptyBatches, @s3, key, cert}) ->
    super()
    @batchSeconds      or= 10
    @saveEmptyBatches  or= false
    @reqCounter = 0
    @serverToken = randomToken 8
    @nextBatch = []
    @batchNumber = 1
    @server = _createServer key, cert, ((req, res) => @handleRequest req, res)
    intervalSet (@batchSeconds * 1000), () =>
      @_saveBatch()
  
  listen: (port, callback=(->)) ->
    @server.listen port, callback
  
  handleRequest: (req, res) ->
    
    reqId = @_nextReqId()
    
    req.on 'data', (data) =>
      t = new Date().getTime()
      @_save _encodeRequestData t, reqId, req, data
    
    req.on 'end', () =>
      t = new Date().getTime()
      @_save _encodeRequestEnd t, reqId, req
      res.writeHead 200, {'Content-Type': 'text/plain'}
      res.end "OK\n"
  
  _save: (data) ->
    @nextBatch.push pack data.length
    @nextBatch.push data
  
  _nextReqId: () ->
    @reqCounter++
    @reqCounter
  
  _saveBatch: () ->
    if @saveEmptyBatches or @nextBatch.length > 0
      data = joinBuffers @nextBatch
      datecode = strftime.strftimeUTC "%Y-%m-%d/%H-%M-%S-%L-Z"
      @s3.key = "v1/#{datecode}-#{@serverToken}-#{randomToken(8)}-#{@batchNumber}-v1"
      @s3.data = data
      postToS3 @s3, (e) =>
        if not e
          @emit 'batch-saved', {key:@s3.key}
      delete @s3.data
      @nextBatch = []
      @batchNumber++


_createServer = (key, cert, handler) ->
  if key and cert
    https.createServer {key:key, cert:cert}, handler
  else
    http.createServer handler


REQ_DATA_EVENT = 1
REQ_END_EVENT = 2


_encodeRequestData = (t, reqId, req, data) ->
  pack {
    1: REQ_DATA_EVENT
    2: reqId
    3: t
    
    4: data.toString 'base64'
  }


_encodeRequestEnd = (t, reqId, req) ->
  remoteIp = req.headers['x-forwarded-for']
  contentType = req.headers['content-type']
  pack {
    1: REQ_END_EVENT
    2: reqId
    3: t
    
    5: if remoteIp then new Buffer(remoteIp, 'utf-8') else null
    6: if contentType then new Buffer(contentType, 'utf-8') else null
    7: new Buffer req.url
  }


module.exports =
  LoggingServer: LoggingServer
