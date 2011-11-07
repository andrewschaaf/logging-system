
{EventServer} = require './event-server'

{port} = require('optimist').argv

if port
  port = parseInt port, 10
else
  port = 7007

s = new EventServer verbose:true
s.listen port, () ->
  console.log "Listening on #{port}..."
