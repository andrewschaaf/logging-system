
{noisyExec} = require 'tafa-misc-util'


task 'build', () ->
  noisyExec "coffee -co lib src", () ->
    noisyExec "stylus -c public", () ->


task 'dev', () ->
  noisyExec "coffee -cwo lib src"
  noisyExec "stylus -c -w public"
  noisyExec "hotnode lib/server.js"


task 'test', () ->
  {test} = require './test/test'
  test()

