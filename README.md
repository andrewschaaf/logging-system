
# Intro

## Events
An event consists of:
<pre>
    <b>Key</b>       JSONValue'*           (JSON, <a href="http://keyjson.org">keyjson</a>)
    <b>Type</b>      uint16 or unicode     (JSON, <a href="http://msgpack.org/">msgpack</a>)
    <b>Value</b>     <a href="http://json.org/">JSONObject</a>            (JSON, <a href="https://code.google.com/apis/protocolbuffers/docs/encoding.html">protobuf</a> (needing a .proto file to view/analyze))

* no non-integer numbers, no nested structures, no <a href="http://www.fileformat.info/info/unicode/char/0000/index.htm">\u0000</a>
</pre>

Keys must be distinct so the server can be [idempotent](https://secure.wikimedia.org/wikipedia/en/wiki/Idempotence#Computer_science_meaning).


## API
<pre>
// This API call is idempotent -- if at first you don't get a 200, try, try again.
POST /api/post-events
    application/json:         {events: [{k: ..., type: ..., v: ...}, ...]}
or  application/eventbuf-v2:  TODO efficient binary format
</pre>


## Use Cases

### Log files

* k: <code>[server_token, "/var/log/some-server/2011-12-31-23-59-59.log", line\_number]</code>
* v: <code>{t:..., line:"..."}</code>

### Web Analytics

* GET requests to lighttpd, with rotated logs
* Tail 'em:
    * For each GET request:
        * For each event, i in that request:
            * k: <code>[t, line\_number, i, server\_id]</code>
            * v: ...parsed...
            * type: ...parsed...


## NodeJS Client
<pre>
{EventClient} = require 'event-server'

logger = new EventClient url:"http://localhost:7007"
log = (args...) -> logger.log args...

log k:[19, 5435, 'Foo'], type:'bar', v:{}
for i in [0...10]
  log 'foo', {...} # key: [t, counter]
</pre>


# Servers

## DevServer

Saves all events in a global array.

<pre>
{DevServer} = require 'logging-system'
new DevServer port:7007
</pre>


## S3POSTingServer (TODO)
<pre>
{S3POSTingServer} = require 'logging-system'
new S3POSTingServer port:7007, batchSeconds:10, s3:<a href="https://github.com/andrewschaaf/node-s3-post">{signature64:,policy64:,AWSAccessKeyId:,bucket:}</a>
</pre>

This server just logs all incoming HTTP request fragments to S3 in batches.

<b>TODO</b>: Each request...

* ...gets a 200 response when all of the S3 requests containing its fragments have succeeded
* ...gets a 500 when any of those S3 requests fails

(For now: 200 immediately, hope for the best)

#### [S3 Pricing](http://aws.amazon.com/s3/#pricing)
<pre>
{PUT,LIST}s          100,000 for 1 USD    => (every 10 sec => 2.6 USD/month)
{GET}s             1,000,000 for 1 USD
storage     >= 7.14 GB-month for 1 USD
</pre>

#### S3 Keys
<pre>
"v1/%Y-%m-%d/%H/%M-%S-<a href="https://github.com/samsonjs/strftime/commit/c5362e748c43c6673be83cec92e8887bf92cb60b">%L</a>-Z-" + randomToken(8) + ".gz"
</pre>

#### Batch Format V1
<pre>
write "\x01" # format v1
for e in http_events:
  data = utf8(json(e))
  write uint32le(data.length)
  write data

# http_events:
#     {
#       type:   'data'
#       t:      new Date().getTime()
#       req_id: ...
#       data64: data.toString 'base64'
#     }
#     {
#       type:   'end'
#       t:      new Date().getTime()
#       req_id: ...
#       path:   req.path
#     }
</pre>

#### Batch Format V2
TODO (length-prefixed protobuf) or msgpack


## S3TailingServer

TODO
