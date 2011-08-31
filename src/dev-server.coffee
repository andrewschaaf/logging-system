
express = require 'express'
{readData, reversed} = require 'tafa-misc-util'


class DevServer
  constructor: () ->
    
    @events = []
    
    app = @app = express.createServer()
    app.set 'views', "#{__dirname}/../views"
    app.set 'view engine', 'jade'
    app.use app.router
    app.use express.static "#{__dirname}/../public"
    app.use express.errorHandler {dumpExceptions: true, showStack: true}
    @initApp app
    port = process.env.PORT or 7007
    app.listen port, () =>
      console.log "Listening on #{port}..."
  
  initApp: (app) ->
    
    app.get '/', (req, res, next) =>
      res.render 'index', locals:
        events: reversed(@events)
    
    app.post '/api/post-events', (req, res, next) =>
      # TODO: idempotency, sort by key
      readData req, (data) =>
        {events} = JSON.parse data.toString()
        for e in events
          e.items = for own k, v of e
            [k, JSON.stringify v]
          e.items.sort()
          @events.push e
        res.writeHead 200, {'Content-Type': 'text/plain'}
        res.end 'OK'
  

module.exports =
  DevServer: DevServer
