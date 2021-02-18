const appInsights = require('./app/app-insights')
const { EventReceiver, EventSender } = require('./app/events')

module.exports = {
  EventSender,
  EventReceiver,
  appInsights
}
