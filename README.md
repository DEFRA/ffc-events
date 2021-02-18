# ffc-events

Events npm module for FFC services

## Usage

### Installation

```
npm install --save ffc-events
```

### Configuration

`name` - name of connection, if not supplied the address name will be used.  This value is also used in App Insights tracing

`host` - Event broker hostname, when using Azure Event Hubs provide the namespace, for example, `myeventhubs.servicebus.windows.net`

`port` - Event broker port, defaults to `9093` if not supplied.  When using `token` or `connectionString` authentication with Azure Event Hubs, value is ignored as that must always be `9093`.

`authentication` - method to authenticate connection to broker.  
Allowed values: 
- `password` for username and password
- `connectionString` for Azure Event Hubs only
- `token` for [AAD Pod Identity](https://github.com/Azure/aad-pod-identity) with Azure Event Hubs

If not supplied then no authentication is configured.

`mechanism` - SASL authentication method.  Only required if `authentication` is `password`.
Allowed values:
- `plain` - plain text
- `scram-sha-512` - scram 512
- `scram-sha-265` - scram 265

If not supplied then `plain` is used

`username` - Broker SASL username.  Only required if `authentication` is `password`.

`password` - Broker SASL password.  Only required if `authentication` is `password`.

`connectionString` - Connection String.  Only required if `authentication` is `connectionString`.

`topic` - The name of the topic/Event Hub to connect to.

`clientId` - How the client should be identified within the broker.  For example, `ffc-demo-claim-service`

`consumerGroupId` - (Consumer only) The name of the consumer group to join.  For example, `ffc-demo-claim-service`

`fromBeginning` - (Consumer only) Consumers by default will fetch messages from the latest committed offset.  If this value is not defined then `fromBeginning` determines the behaviour of the consumer group.  If `true` the earliest offset is used, if `false` then the latest is used.  If not supplied then `true` is used as default.

`appInsights` - Application Insights module if logging is required.

`retries` - How many times should a sender try to connect to broker, defaulting to `5` if not supplied.  

`retryWaitInMs` - How long should a connection wait in milliseconds before trying to reconnect, defaulting to `500` if not supplied.

`routingKey` - If a routing key is supplied then any events not matching the key will be automatically discarded.

#### Example

```
const config {
  name: 'ffc-demo-collector-claim-update',
  host: 'localhost',
  port: 9093,
  authentication: 'password',
  username: 'username',
  password: 'password',
  mechanism: 'scram-sha-512',
  topic: 'ffc-demo-claim-update',
  clientId: 'ffc-demo-collector',
  consumerGroupId: 'ffc-demo-collector',
  fromBeginning: true,
  appInsights: require('applicationinsights')
}
```

### Sending an event

Events objects must follow the below structure.

`body` - The body of the event.

`type` - Type of message using reverse DNS notation. For example, `uk.gov.demo.claim.validated`.

`subject` - Optional, if the body alone is not sufficient to give context to the recipient.  For example, `myImage.jpeg`.

`source` - Name of the service sending the event.  For example, `ffc-demo-claim-service`

`headers` - Optional, key value pair object of any metadata to be attached to the event.


#### Example

```
// Events are sent as an array
const events = [{
  body: { claimId: 1 },
  type: 'uk.gov.demo.claim.validated',
  subject: 'New Claim',
  source: 'ffc-demo-claim-service'
}]
```
```
const sender = new EventSender(config)
await sender.connect()
await sender.sendEvents(events)

// shutdown when needed
await sender.closeConnection()
```

### Consuming events

Permanantely subscribe to all new events from latest offest.  Messages are automatically periodically committed.

```
const action = function (event) {
  console.log(event.value.toString())
}

const receiver = new EventReceiver(config, action)
await receiver.connect()
await receiver.subscribe()

// shutdown when needed
await receiver.closeConnection()
```

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT
LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and
applications when using this information.

> Contains public sector information licensed under the Open Government license
> v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her
Majesty's Stationery Office (HMSO) to enable information providers in the
public sector to license the use and re-use of their information under a common
open licence.

It is designed to encourage use and re-use of information freely and flexibly,
with only a few conditions.
