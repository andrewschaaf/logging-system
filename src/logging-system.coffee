
{DevServer} = require './dev-server'
{EventClient} = require './client'


createDevServer = (opt={}) ->
  new DevServer


module.exports =
  createDevServer: createDevServer
  EventClient: EventClient
