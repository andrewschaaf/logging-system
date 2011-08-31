
http = require 'http'
https = require 'https'
url = require 'url'

#LATER: batches
#LATER: persist to HD first

class EventClient
  constructor: (opt) ->
    parsed = url.parse opt.url
    @counter = 0
    if parsed.protocol == 'http:'
      @httpHandler = http
    else if parsed.protocol == 'https:'
      @httpHandler = https
    else
      throw new Error 'URL must include "http:" or "https:"'
    @httpOpt = {
      method: 'POST'
      host: parsed.hostname
      path: "/api/post-events"
      headers: {
        'Content-Type': 'application/json'
      }
    }
    if parsed.port
      @httpOpt.port = parsed.port
    console.log JSON.stringify @httpOpt
  
  log: (x, y) ->
    t = new Date().getTime()
    @counter++
    i = @counter
    info = if y then {type: x, v: y} else x
    if not info.k
      info.k = [t, i]
    data = new Buffer JSON.stringify {events: [info]}
    @httpOpt.headers['Content-Length'] = data.length
    req = @httpHandler.request @httpOpt, (res) =>
    req.end data
  


module.exports =
  EventClient: EventClient
