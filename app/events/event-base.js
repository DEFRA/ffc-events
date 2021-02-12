const { Kafka, logLevel } = require('kafkajs')
const { DefaultAzureCredential } = require('@azure/identity')
const retry = require('../retry')

class EventBase {
  constructor (config) {
    this.connectionName = config.name || config.topic
    this.config = config
    this.appInsights = config.appInsights
    this.topic = config.topic
    this.port = this.getPort(config.port)
    this.routingKey = config.routingKey
  }

  async connect () {
    const credentials = this.getCredentials()
    this.kafka = new Kafka({
      logLevel: this.config.logLevel || logLevel.ERROR,
      brokers: [`${this.config.host}:${this.port}`],
      clientId: this.config.clientId,
      retry: {
        initialRetryTime: this.config.retryWaitInMs || 500,
        retries: this.config.retries || 5
      },
      ...credentials
    })
    console.log('Kafka:', this.kafka)
  }

  getPort (port) {
    return this.config.authentication === 'token' ? 9093 : port
  }

  getCredentials () {
    switch (this.config.authentication) {
      case 'password':
        return this.getPasswordCredentials()
      case 'token':
        return this.getTokenCredentials()
      default:
        return {}
    }
  }

  getPasswordCredentials () {
    return {
      sasl: {
        mechanism: this.config.mechanism || 'plain',
        username: this.config.username,
        password: this.config.password
      }
    }
  }

  async getTokenCredentials () {
    return {
      ssl: true,
      sasl: {
        mechanism: 'oauthbearer',
        oauthBearerProvider: async () => {
          const accessToken = await retry(() => this.getToken(), this.config.retries, this.config.retryWaitInMs, false)
          return { value: accessToken.token }
        }
      }
    }
  }

  async getToken () {
    const credential = new DefaultAzureCredential()
    return await credential.getToken([`https://${this.config.host}.servicebus.windows.net`])
  }
}

module.exports = EventBase
