import { waitForLeadership } from 'tab-election';

let config = {}
let usage = {}
let featureFlags = {}
let subscribers = {}

const storage = window.localStorage

function setup(opts) {
  config.protocol = opts.protocol || 'https'
  config.host = opts.host || 'fleature-web.fly.dev'
  config.port = opts.port || '443'
  config.clientId = opts.clientId
  config.clientSecret = opts.clientSecret
  config.baseUrl = `${config.protocol}://${config.host}:${config.port}`
  config.params = `client_id=${config.clientId}&client_secret=${config.clientSecret}`

  waitForLeadership(() => {
    const url = `${config.baseUrl}/api/feature_flags/events?${config.params}`
    const events = new EventSource(url)

    events.addEventListener("message", function (e) {
      const [name, value] = e.data.split('=')
      const status = value === 'true'
      featureFlags[name] = status
      storage.featureFlags = JSON.stringify(featureFlags)
      notifySubscribers(name, status)
    })
  })

  window.addEventListener('storage', event => {
    if (event.key === 'featureFlags') {
      featureFlags = JSON.parse(event.newValue)
      changedKeys(event).forEach(key => notifySubscribers(key, featureFlags[key]))
    }
  })


  for (let flag of opts.enabledFlags) {
    enable(flag)
  }

  fetchFeatureFlags()
  setInterval(sendUsageData, 10000)
}

function isEnabled(name) {
  const count = usage[name] || 0
  usage[name] = count + 1
  return featureFlags[name] === true
}

function enable(name) {
  featureFlags[name] = true
}

function disable(name) {
  featureFlags[name] = false
}

function subscribe(name, callback) {
  const currentSubscribers = subscribers[name] || []
  currentSubscribers.push(callback)
  subscribers[name] = currentSubscribers

  return () => {
    const index = subscribers[name].indexOf(callback)
    if (index > -1) {
      subscribers[name].splice(index, 1)
    }
  }
}

async function sendUsageData() {
  const url = `${config.baseUrl}/api/feature_flags/usage?${config.params}`
  await fetch(url, {
    method: 'POST',
    body: JSON.stringify(usage)
  })
  usage = {}
}

async function fetchFeatureFlags() {
  const url = `${config.baseUrl}/api/feature_flags?${config.params}`
  try {
    const results = await fetch(url)
    const json = await results.json()
    for (const x in json) {
      const { name, status } = json[x]
      featureFlags[name] = status
    }
  } catch (error) {
    console.error(error)
  }
}

function notifySubscribers(name, status) {
  const callbacks = subscribers[name] || []
  callbacks.forEach(subscriber => subscriber(status))
}

function changedKeys(event) {
  const oldValue = JSON.parse(event.oldValue)
  const newValue = JSON.parse(event.newValue)
  const keys = Object.keys(newValue)
  const changedKeys = []

  for (const key of keys) {
    if (newValue[key] !== oldValue[key]) {
      changedKeys.push(key)
    }
  }

  return changedKeys
}

const fleature = {
  setup,
  isEnabled,
  enable,
  disable,
  subscribe
}

Object.freeze(fleature)

export default fleature
