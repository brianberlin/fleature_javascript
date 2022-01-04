import { Socket } from 'phoenix'

let featureFlags = {}

let subscribers = {
  flag: {},
  all: []
}

function setup(opts) {
  const protocol = opts.protocol || 'wss'
  const host = opts.host || 'fleature-web.fly.dev'
  const port = opts.port || 443
  const topic = `client:${opts.clientId}`
  const socketUrl = `${protocol}://${host}:${port}/clients`

  const socketOpts = {
    params: {
      client_id: opts.clientId,
      client_secret: opts.clientSecret
    }
  }

  const socket = new Socket(socketUrl, socketOpts)

  socket.connect()
  
  const channel = socket.channel(topic, {})

  channel.on("update_all", newFeatureFlags => {
    featureFlags = newFeatureFlags
    subscribers.all.forEach(callback => callback(newFeatureFlags))
  })

  channel.on("update_one", ({name, status}) => {
    const callbacks = subscribers.flag[name] || []
    callbacks.forEach(subscriber => subscriber(status))
  })

  channel.join()

  for (let flag of opts.enabledFlags) {
    enable(flag)
  }
}

function isEnabled(name) {
  return featureFlags[name] === true
}

function enable(name) {
  featureFlags[name] = true
}

function disable(name) {
  featureFlags[name] = false
}

function subscribeAll(callback) {
  const currentSubscribers = subscribers.all || []
  currentSubscribers.push(callback)
  subscribers.all = currentSubscribers

  return () => {
    const index = subscribers.all.indexOf(callback)
    if (index > -1) {
      subscribers.all.splice(index, 1)
    }
  }
}

function subscribe(name, callback) {
  const currentSubscribers = subscribers.flag[name] || []
  currentSubscribers.push(callback)
  subscribers.flag[name] = currentSubscribers

  return () => {
    const index = subscribers.flag[name].indexOf(callback)
    if (index > -1) {
      subscribers.flag[name].splice(index, 1)
    }
  }
}

const fleature = {
  setup,
  isEnabled,
  enable,
  disable,
  subscribe,
  subscribeAll
}

Object.freeze(fleature)

export default fleature
