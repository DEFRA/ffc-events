const EventBase = require('./event-base')
const { trackTrace, trackException } = require('../app-insights')

class EventReceiver extends EventBase {
  constructor (config, action) {
    super(config)
    this.receiverHandler = this.receiverHandler.bind(this)
    this.routingKeyIsValid = this.routingKeyIsValid.bind(this)
    this.action = action
  }

  async connect () {
    await super.connect()
    this.consumer = this.kafka.consumer({ groupId: this.config.consumerGroupId })
    await this.consumer.connect()
  }

  async subscribe () {
    await this.consumer.subscribe({
      topic: this.config.topic,
      fromBeginning: this.config.fromBeginning || true
    })
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!this.routingKey || this.routingKeyIsValid(message)) {
            await this.receiverHandler(message)
          }
        } catch (err) {
          this.receiverError(err)
        }
      }
    })
  }

  routingKeyIsValid (message) {
    if (message.headers.routingKey) {
      const keyValue = message.headers.routingKey.toString()
      return keyValue === this.routingKey
    }
    return true
  }

  receiverError (err) {
    trackException(this.appInsights, err)
    console.error(err)
    throw err
  }

  async receiverHandler (event) {
    trackTrace(this.appInsights, this.connectionName)
    await this.action(event)
  }

  async closeConnection () {
    await this.consumer.disconnect()
  }
}

module.exports = EventReceiver
