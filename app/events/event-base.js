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
    console.log('Connect:', config)
    console.log('Topic:', config.topic)
    console.log('Port:', this.port)
    console.log('Routing key:', this.routingKey)
  }

  async connect () {
    const credentials = await this.getCredentials()
    console.log('Credentials:', this.credentials)
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

  getTokenCredentials () {
    return {
      ssl: true,
      sasl: {
        mechanism: 'oauthbearer',
        oauthBearerProvider: async () => {
          const credential = new DefaultAzureCredential()
          console.log('Identity Credential:', credential)
          const accessToken = await credential.getToken(['https://eventhubs.azure.net'])
          console.log('Token:', accessToken)
          return { value: accessToken.token }
        }
      }
    }
  }
}

module.exports = EventBase
