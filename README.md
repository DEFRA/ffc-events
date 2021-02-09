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

`port` - Event broker port, defaults to `9093` if not supplied.  When using `token` authentication with Azure Event Hubs, value is ignored as that must always be `9093`.

`authentication` - method to authenticate connection to broker.  
Allowed values: 
- `password` for username and password
- `token` for [AAD Pod Identity](https://github.com/Azure/aad-pod-identity) with Azure Event Hubs.  

If not supplied then no authentication is configured.

`mechanism` - SASL authentication method.  Only required if `authentication` is `password`.
Allowed values:
- `plain` - plain text
- `scram-sha-512` - scram 512
- `scram-sha-265` - scram 265

If not supplied then `plain` is used

`username` - Broker SASL username.  Only required if `authentication` is `password`.

`password` - Broker SASL password.  Only required if `authentication` is `password`.

`topic` - The name of the topic/Event Hub to connect to.

`clientId` - How the client should be identified within the broker.  For example, `ffc-demo-claim-service`

`consumerGroupId` - (Consumer only) The name of the consumer group to join.  For example, `ffc-demo-claim-service`

`fromBeginning` - (Consumer only) Consumers by default will fetch messages from the latest committed offset.  If this value is not defined then `fromBeginning` determines the behaviour of the consumer group.  If `true` the earliest offset is used, if `false` then the latest is used.  If not supplied then `true` is used as default.

`appInsights` - Application Insights module if logging is required.

`retries` - How many times should a sender try to connect to broker, defaulting to `5` if not supplied.  

`retryWaitInMs` - How long should a connection wait in milliseconds before trying to reconnect, defaulting to `500` if not supplied.

#### Example

```
const config = {
  host: 'myeventhubs.servicebus.windows.net',
  useCredentialChain: false,
  username: 'mySharedAccessKeyName',
  password: 'mySharedAccessKey,
  address: 'mySubscription,
  type: 'subscription',
  topic: 'myTopic',
  appInsights: require('applicationinsights'),
  retries: 5
}
```

### Sending an event

Events objects must follow the below structure.

`body` - The body of the event.

`type` - Type of message using reverse DNS notation. For example, `uk.gov.demo.claim.validated`.

`subject` - Optional, if the body alone is not sufficient to give context to the recipient.  For example, `myImage.jpeg`.

`source` - Name of the service sending the event.  For example, `ffc-demo-claim-service`


#### Example

```
const message = {
  body: { claimId: 1 },
  type: 'uk.gov.demo.claim.validated',
  subject: 'New Claim',
  source: 'ffc-demo-claim-service'
}
```
```
const sender = new EventSender(config)
await sender.sendMessage(message)

// shutdown when needed
await sender.closeConnection()
```

The `sendMessage` function can also receive all options applicable to Azure Service Bus `sendMessages` as a parameter, see [Azure documentation](https://www.npmjs.com/package/@azure/service-bus).

```
await sender.sendMessage(message, options)
```

### Receiving a message

There are multiple options for receiving a message.

#### Subscribe
Permanantely subscribe to all messages.  Automatically will handle any intermittant disconnects.

```
const action = function (message) {
  console.log(message.body)
}

const receiver = new EventReceiver(config, action)
await receiver.subscribe()

// shutdown when needed
await receiver.closeConnection()
```

#### Receive
Single call to receive current messages messages.

```
const receiver = new EventReceiver(config, action)
// receive a maximum of 10 messages
messages = await receiver.receiveMessages(10)

// shutdown when needed
await receiver.closeConnection()
```

The `receiveMessages` function can also receive all options applicable to Azure Service Bus `receiveMessages` as a parameter, see [Azure documentation](https://www.npmjs.com/package/@azure/service-bus).

```
await receiver.receiveMessages(10, options)
```

It is often beneficial when using this to specify the maximum wait time for both the first message and the last message to improve performance of the application.  For example:

```
// This will wait a maximum of one second for the first message, if no message exists then the response will return.  
// If a message is received within one second it will wait a further five seconds or until it receives 10 messages to return
messages = await receiver.receiveMessages(batchSize, { maxWaitTimeInMs: 1000, maxTimeAfterFirstMessageInMs: 5000 })
```

### Handling a received message
Once a message is received through a peek lock, a response must be sent to Azure Service Bus before the lock expires otherwise Service Bus will resend the message.

If this is not the intended behaviour there are several responses that can be sent.

#### Complete
Message is complete and no further processing needed.

```
await receiver.completeMessage(message)
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
