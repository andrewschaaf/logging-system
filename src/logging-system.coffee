
names = [
  'dev-server'
  'client'
  'logging-server'
]

for name in names
  for own k, v of require "./#{name}"
    exports[k] = v
