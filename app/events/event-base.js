const { Kafka, logLevel } = require('kafkajs')
const { DefaultAzureCredential } = require('@azure/identity')

class EventBase {
  constructor (config) {
    this.connectionName = config.name
    this.appInsights = config.appInsights
    this.topic = config.topic
    this.config = config
    this.connect()
  }

  async connect () {
    const credentials = this.config.usePodIdentity ? await this.getTokenCredentials() : this.getUsernameCredentials()
    this.kafka = new Kafka({
      logLevel: this.config.logLevel || logLevel.ERROR,
      brokers: [`${this.config.host}:${this.config.port}`],
      clientId: this.config.clientId,
      sasl: credentials
    })
  }

  getTokenCredentials () {
    return {
      mechanism: 'oauthbearer',
      oauthBearerProvider: async () => {
        const credential = new DefaultAzureCredential()
        const token = await credential.getToken(['https://servicebus.azure.net'])
        return {
          value: token
        }
      }
    }
  }

  getUsernameCredentials () {
    return {
      mechanism: this.config.mechanism || 'plain',
      username: this.config.username,
      password: this.config.password
    }
  }
}

module.exports = EventBase
