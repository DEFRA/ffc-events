const EventBase = require('./event-base')
const eventSchema = require('./event-schema')
const { trackTrace } = require('../app-insights')
const { CompressionTypes } = require('kafkajs')

class EventSender extends EventBase {
  constructor (config) {
    super(config)
    this.sendEvents = this.sendEvents.bind(this)
    this.validateAndTransformEvent = this.validateAndTransformEvent.bind(this)
    this.enrichEvent = this.enrichEvent.bind(this)
    this.serializeEvent = this.serializeEvent.bind(this)
  }

  async connect () {
    await super.connect()
    this.producer = this.kafka.producer()
    await this.producer.connect()
  }

  async sendEvents (events) {
    await this.connect()
    events = await Promise.all(events.map(this.validateAndTransformEvent))
    trackTrace(this.appInsights, this.connectionName)
    await this.send(events)
    return events
  }

  async send (events) {
    await this.producer.send({
      topic: this.topic,
      compression: CompressionTypes.None,
      messages: events
    })
  }

  async closeConnection () {
    await this.producer.disconnect()
  }

  async validateAndTransformEvent (event) {
    await eventSchema.validateAsync(event)
    const headers = event.headers
    event = this.enrichEvent(event)
    event = this.serializeEvent(event, headers)
    return event
  }

  enrichEvent (event) {
    return {
      body: event.body,
      subject: event.subject,
      type: event.type,
      source: event.source
    }
  }

  serializeEvent (event, headers = {}) {
    return {
      headers,
      value: JSON.stringify(event)
    }
  }
}

module.exports = EventSender
