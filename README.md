

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



## DevServer

Saves all events in a global array.

<pre>
{DevServer} = require 'logging-system'
new DevServer
</pre>

* [http://localhost:7007/](http://localhost:7007/)

## S3POSTingServer

TODO

## S3TailingServer

TODO


## NodeJS Client
<pre>
{EventClient} = require 'event-server'

logger = new EventClient {url: "http://localhost:7007"}
log = (args...) -> logger.log args...

log k:[19, 5435, 'Foo'], type:'bar', v:{}
for i in [0...10]
  log 'foo', {...} # key: [t, counter]
</pre>

## Java Client

TODO

# Use Cases

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
