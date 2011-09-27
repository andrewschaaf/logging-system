
names = [
  'dev-server'
  'client'
  'logging-server'
  'event-server'
]

for name in names
  for own k, v of require "./#{name}"
    exports[k] = v
