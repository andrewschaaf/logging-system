
This package helps you log zillions of events {cheaply,efficiently,reliably}.

## EventBucket

An EventBucket is a set of events.

## Event
<pre>
    <b>Key</b>            JSONValue'*, **
    <b>Type</b>           uint16 or unicode
    <b>Value</b>          <a href="http://json.org/">JSONObject</a>            (e.g. via JSON, <a href="https://code.google.com/apis/protocolbuffers/docs/encoding.html">protobuf</a> (needing a .proto file to view/analyze))
    <b>Client Time</b>   ms since 1970         client-specified timestamp
    <b>Server Time</b>   ms since 1970         when the event was received by the logging server
</pre>

\* no non-integer numbers, no nested structures, no <a href="http://www.fileformat.info/info/unicode/char/0000/index.htm">\u0000</a><br/>
\** Keys must be distinct so the server can be [idempotent](https://secure.wikimedia.org/wikipedia/en/wiki/Idempotence#Computer_science_meaning).


# Stuff
<pre>
{LoggingServer, EventServer, EventClient} = require 'logging-system'
</pre>


# APIs

## {LoggingServer,EventServer} API
<pre>
POST /api/post-events?bucket=TOKEN
    Content-Type: "application/json" or "application/eventbuf-v2"
    Request body: See "Formats" section
    
    Response status:
      2xx or 5xx
      TODO: 2xx only after all data has been fully persisted
      (TEMP: 2xx immediately)
</pre>

## EventServer API
<pre>
GET /events.json?bucket=TOKEN
  {"events": [{...see JSON Event Format...}...]}

GET /reset
  Delete all events.
</pre>

# Servers

## LoggingServer

* Logs all data of all incoming HTTP requests in batches
* HTTP requests are not parsed. Not even a little. // TEMP: requiring UTF-8 for now
* Batches are POSTed to S3
* One batch every 10 sec implies 2.6 USD/month for POST requests

<pre>
server = new LoggingServer {
  s3: {
    AWSAccessKeyId: "..."
    <a href="https://github.com/andrewschaaf/node-s3-post">policy64</a>:       "..."
    signature64:    "..."
    bucket:         "..."
    customUrl:      "https://<a href="https://github.com/andrewschaaf/node-aws-stuff">my-s3-clone</a>:12345"    # OPTIONAL
  }
  batchSeconds: 10                                 # OPTIONAL
}
server.listen PORT, () -> console.log "Listening on #{PORT}..."
# AND/OR:
...(req, res) ->
  if ...
    server.handleRequest req, res
</pre>

## EventServer
<pre>
server = new EventServer()
server.listen PORT, () -> console.log "Listening on #{PORT}..."
server.reset() # delete all events
</pre>

### Datastore usage
<pre>
[EVENTS, bucket, k_string]                      -> eventJson // later protobuf
[INDEXED_EVENTS, bucket, indexId, ...index...]  -> eventJson // later protobuf
</pre>


# Formats

## JSON event
<pre>
{
  "key": ...,
  "type": ...,
  "value": ...,
  "clientTime": 1317062859638
}
</pre>

## JSON events
<pre>
{
  "events": [...]
}
</pre>


## eventbuf-v3 event
<pre>
TODO
</pre>

## eventbuf-v3 events
<pre>
Just concatenate 'em.
</pre>



## LoggingServer S3 Objects

### Key
<pre>
"v1/%Y-%m-%d/%H-%M-%S-<a href="https://github.com/samsonjs/strftime/commit/c5362e748c43c6673be83cec92e8887bf92cb60b">%L</a>-Z-" + serverToken + "-" + randomToken(8, BASE58_ALPHABET) + "-" + batchNumber + "-v2"
  ...where, when the server starts, serverToken := randomToken(8, BASE58_ALPHABET)

  If the body is gzipped, append ".gz".
</pre>

### Batch format, V2

Concatenated HTTP events, each of which is:
<pre>
  msgpack(length_of_the_following)  # because msgpack libraries don't support streaming
  msgpack(http_event)
</pre>

#### HTTP events
<pre>
REQ_DATA_EVENT = 1
REQ_END_EVENT = 2
{
  1: REQ_DATA_EVENT
  2: reqId
  3: ms_timestamp_of_first_fragment
  8: fragment_id
  
  4: data
}
{
  1: REQ_END_EVENT
  2: reqId
  3: ms_timestamp_of_first_fragment
  8: fragment_id
  
  5: remote IP      UTF-8
  6: content-type   UTF-8
  7: path           UTF-8
}
</pre>


# Notes

### [S3 Pricing](http://aws.amazon.com/s3/#pricing)
<pre>
{PUT,LIST}s          100,000 for 1 USD    => (every 10 sec => 2.6 USD/month)
{GET}s             1,000,000 for 1 USD
storage     >= 7.14 GB-month for 1 USD
</pre>
