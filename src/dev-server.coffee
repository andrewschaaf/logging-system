
express = require 'express'
{readData, reversed, xmlEscape} = require 'tafa-misc-util'


class DevServer
  constructor: () ->
    
    @events = []
    @counter = 0
    
    app = @app = express.createServer express.logger()
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
    
    app.get '/reset', (req, res, next) =>
      console.log '*** RESET ***'
      @events = []
      @counter = 0
      res.writeHead 200, {'Content-Type': 'text/plain'}
      res.end 'OK'
    
    app.post '/api/post-events', (req, res, next) =>
      # TODO: idempotency, sort by key
      readData req, (data) =>
        console.log '------------------'
        console.log data.toString()
        console.log '------------------'
        {events} = JSON.parse data.toString()
        for e in events
          @counter++
          if not e.k
            e.k = [new Date().getTime(), @counter]
          e.items = for own k, v of e
            v_html = "<pre>#{xmlEscape JSON.stringify v, null, 2}</pre>"
            [k, v_html]
          e.items.sort()
          @events.push e
        res.writeHead 200, {'Content-Type': 'text/plain'}
        res.end 'OK'
  

module.exports =
  DevServer: DevServer
