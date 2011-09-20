
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
      @port = 80
    else if parsed.protocol == 'https:'
      @httpHandler = https
      @port = 443
    else
      throw new Error 'URL must include "http:" or "https:"'
    
    @host = parsed.hostname
    if parsed.port
      @port = parsed.port
  
  resetServer: (callback=(->)) ->
    opt = {
      host: @host
      port: @port
      path: "/reset"
    }
    @httpHandler.get opt, (res) =>
      callback()
  
  log: (x, y) ->
    t = new Date().getTime()
    @counter++
    i = @counter
    info = if y then {type: x, v: y} else x
    if not info.k
      info.k = [t, i]
    data = new Buffer JSON.stringify {events: [info]}
    
    opt = {
      method: 'POST'
      host: @host
      port: @port
      path: "/api/post-events"
      headers: {
        'Content-Type': 'application/json'
        'Content-Length': data.length
      }
    }
    req = @httpHandler.request opt, (res) =>
    req.end data
  


module.exports =
  EventClient: EventClient
