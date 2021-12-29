import { Socket } from 'phoenix'

class Fleature {
  featureFlags = {}
  
  get socketOpts() {
    return {
      params: {
        client_id: this.clientId,
        client_secret: this.clientSecret
      }
    }
  }

  get socketUrl() { 
    return `${this.protocol}://${this.host}:${this.port}/clients`
  }
  
  get topic() { 
    return `client:${this.clientId}`
  }

  setup(opts) {
    this._parseOptions(opts)
    this._setupSocket()

    for (let flag of opts.enabledFlags) {
      this.enable(flag)
    }
  }

  isEnabled(name) {
    return this.featureFlags[name] === true
  }

  enable(name) {
    this.featureFlags[name] = true
  }

  disable(name) {
    this.featureFlags[name] = false
  }

  _setupSocket() {
    this.socket = new Socket(this.socketUrl, this.socketOpts)
    this.socket.connect()
    this.channel = this.socket.channel(this.topic, {})

    this.channel.on("update_all", featureFlags => this.featureFlags = featureFlags)

    this.channel.on("update_one", featureFlags => {
      for (let flag in featureFlags) {
        this.featureFlags[flag] = featureFlags[flag]
      }
    })

    this.channel.join()
  }

  _parseOptions(opts) {
    this.clientId = opts.clientId
    this.clientSecret = opts.clientSecret
    this.protocol = opts.protocol || 'wss'
    this.host = opts.host || "fleature-web.fly.dev"
    this.port = opts.port || 443
  }
}

const fleature = new Fleature()

export default fleature