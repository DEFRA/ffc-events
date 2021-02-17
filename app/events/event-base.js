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
    this.getToken = this.getToken.bind(this)
  }

  async connect () {
    const credentials = this.getCredentials()
    this.kafka = new Kafka({
      logLevel: this.config.logLevel || logLevel.NOTHING,
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
    return (this.config.authentication === 'token' || this.config.authentication === 'connectionString') ? 9093 : port
  }

  getCredentials () {
    switch (this.config.authentication) {
      case 'connectionString':
        return this.getConnectionStringCredentials()
      case 'password':
        return this.getPasswordCredentials()
      case 'token':
        return this.getTokenCredentials()
      default:
        return {}
    }
  }

  getConnectionStringCredentials () {
    return {
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: '$ConnectionString',
        password: this.config.connectionString
      }
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
          const accessToken = await retry(() => this.getToken(), 10, 1000, true)
          return {
            value: accessToken.token
          }
        }
      }
    }
  }

  async getToken () {
    const credential = new DefaultAzureCredential()
    return await credential.getToken([`https://${this.config.host}`])
  }
}

module.exports = EventBase
