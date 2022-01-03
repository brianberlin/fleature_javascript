import { Socket } from 'phoenix'
import EventEmitter from 'events'

const eventEmitter = new EventEmitter()

let featureFlags = {}

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

  channel.on("update_all", newFeatureFlags => featureFlags = newFeatureFlags)

  channel.on("update_one", ({key, value}) => {
    if (featureFlags[key] !== value) {
      eventEmitter.emit(key, value)
    }
    featureFlags[key] = value
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

function addListener(key, callback) {
  eventEmitter.on(key, callback)
}

function removeListener(key, callback) {
  eventEmitter.removeListener(key, callback)
}

function removeAllListeners(key) {
  eventEmitter.removeAllListeners(key)
}

const fleature = {
  setup,
  isEnabled,
  enable,
  disable,
  addListener,
  removeListener,
  removeAllListeners
}

Object.freeze(fleature)

export default fleature
