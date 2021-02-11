const { Kafka, logLevel } = require('kafkajs')
const { DefaultAzureCredential } = require('@azure/identity')

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

  getTokenCredentials () {
    return {
      ssl: true,
      sasl: {
        mechanism: 'oauthbearer',
        oauthBearerProvider: async () => {
          const credential = new DefaultAzureCredential()
          const accessToken = await credential.getToken(['https://eventhubs.azure.net'])
          return { value: accessToken.token }
        }
      }
    }
  }
}

module.exports = EventBase
