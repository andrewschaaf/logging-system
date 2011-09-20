
http = require 'http'
{postToS3} = require 's3-post'


class S3POSTingServer
  constructor: ({port, batchSeconds, s3}) ->
    port          or= 7007
    batchSeconds  or= 10
    {signature64, policy64, AWSAccessKeyId, bucket} = s3
    
    if AWSAccessKeyId.match /^https?:\/\//
      @s3Url = 
      AWSAccessKeyId = 'none'
    else
      @s3Url
    
    server = http.createServer (req, res) =>
      
    server.listen port, () ->
      console.log "Listening on #{port}..."
  
  nextId: () ->
     


module.exports =
  S3POSTingServer: S3POSTingServer
