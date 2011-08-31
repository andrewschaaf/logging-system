
{noisyExec} = require 'tafa-misc-util'


task 'dev', () ->
  noisyExec "coffee -cwo lib src"
  noisyExec "stylus -c -w public"
  noisyExec "hotnode lib/server.js"


task 'test', () ->
  {test} = require './test/test'
  test()
