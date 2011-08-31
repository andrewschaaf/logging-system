
http = require 'http'


postEvents = (events, callback=(->)) ->
  data = new Buffer JSON.stringify {events: events}
  opt = {
    host: '127.0.0.1'
    port: 7007
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


test = () ->
  postEvents [{
    type: "foo"
    k: [new Date().getTime(), 1]
    v: {line: 'v1'}
  }], () ->
    console.log 'OK'


module.exports =
  test: test
