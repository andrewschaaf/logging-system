
http = require 'http'
assert = require 'assert'
{postToS3} = require 's3-post'
{S3Server, cert} = require 'aws-stuff'
{LoggingServer, EventServer} = require '../lib/logging-system'
{timeoutSet} = require 'tafa-misc-util'


S3_PORT = 47510
LOGGING_PORT = 47511
EVENT_PORT = 7007
BUCKET = "takin-mah-bukket"


postEvents = (events, callback=(->)) ->
  data = new Buffer JSON.stringify {events: events}
  opt = {
    host: 'localhost'
    port: LOGGING_PORT
    path: "/api/post-events"
    method: 'POST'
    headers: {
      'Content-Type': 'application/json'
      'Content-Length': data.length
    }
  }
  req = http.request opt, (res) ->
    callback (if res.statusCode == 200 then null else res.statusCode)
  req.end data


EVENTS = for i in [0...10]
  {
    type: "foo"
    key: i
    value: {line: 'v1'}
    clientTime: new Date().getTime()
  }

S3_POST_ACCESS = {
  ca: cert
  customUrl: "https://localhost:#{S3_PORT}"
  bucket: BUCKET
  
  AWSAccessKeyId: "ignored"
  policy64:       "ignored"
  signature64:    "ignored"
}

S3_FULL_ACCESS = {
  ca: cert
  customUrl: "https://localhost:#{S3_PORT}"
  bucket: BUCKET
  
  key: "ignored"
  secret: "ignored"
}

throwe = (callback) ->
  (e, args...) ->
    throw e if e
    callback e, args...

test = () ->
  
  batch_keys = []
  
  # S3Server
  s3 = new S3Server verbose:true
  s3.listen S3_PORT, () ->
  
  # LoggingServer
  logging = new LoggingServer {
    s3: S3_POST_ACCESS
    batchSeconds: 1
  }
  logging.listen LOGGING_PORT, () ->
    logging.on 'batch-saved', ({key}) ->
      console.log "Batch saved: #{key}"
      batch_keys.push key
    
    # EventServer
    eventServer = new EventServer s3:S3_FULL_ACCESS
    eventServer.listen EVENT_PORT, () ->
      timeoutSet 1, () ->
        
        postEvents EVENTS, () ->
          timeoutSet 1500, () ->
            postEvents EVENTS, () ->
              timeoutSet 1500, () ->
                
                assert.equal batch_keys.length, 2
                
                [k1, k2] = batch_keys
                eventServer._processNewBatch k1, throwe () ->
                  eventServer._processNewBatch k2, throwe () ->
                    
                    console.log 'OK'
                    process.exit 0


if not module.parent
  test()

module.exports =
  test: test
