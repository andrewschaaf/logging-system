
http = require 'http'
assert = require 'assert'
{postToS3} = require 's3-post'
{S3Server, cert} = require 'aws-stuff'
{LoggingServer} = require '../lib/logging-system'
{timeoutSet} = require 'tafa-misc-util'


S3_PORT = 47510
LOGGING_PORT = 47511
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




test = () ->
  
  batch_keys = []
  
  s3 = new S3Server
  s3.listen S3_PORT, () ->
  
  logging = new LoggingServer {
    s3: {
      customUrl: "https://localhost:#{S3_PORT}"
      bucket: BUCKET
      policy64:       "ignored"
      signature64:    "ignored"
      AWSAccessKeyId: "ignored"
      ca: cert
    }
    batchSeconds: 1
  }
  logging.listen LOGGING_PORT, () ->
    logging.on 'batch-saved', ({key}) ->
      console.log "Batch saved: #{key}"
      batch_keys.push key
    postEvents EVENTS, () ->
      timeoutSet 1500, () ->
        postEvents EVENTS, () ->
          timeoutSet 1500, () ->
            assert.equal batch_keys.length, 2
            console.log 'OK'
            process.exit 0


if not module.parent
  test()

module.exports =
  test: test
