# ffc-events

Events npm module for FFC services

## Usage

### Installation

```
npm install --save ffc-events
```

### Configuration

`host` - Azure Service Bus namespace, for example, `myservicebus.servicebus.windows.net`

`useCredentialChain` - Boolean value for whether to authenticate connection with using Azure's credential chain.  For example, set this to true if you wish to use [AAD Pod Identity](https://github.com/Azure/aad-pod-identity).  If `false`, then `username` and `password` are required.

`username` - Azure Service Bus Shared Access Key name for authentication.  Not required if `useCredentialChain` is `true`.

`password` - Azure Service Bus Shared Access Key value for authentication.  Not required if `useCredentialChain` is `true`.

`type` - Azure Service Bus entity to connect to, allows `queue`, `topic` or `subscription`.

`topic` - The name of the topic/event hub to connect to.

`appInsights` - Application Insights module if logging is required

`retries` - How many times should a sender try to send a message, defaulting to `5` if not supplied.  With Pod Identity and Azure Identity there is a scenario that the identity will not be allocated in time for it's usage which causes failure sending messages.  `5` is usually sufficient but can be increased if necessary.

`retryWaitInMs` - How long should a sender wait in milliseconds before trying to resend, defaulting to `500` if not supplied.

`exponentialRetry` - Whether to exponentially retry, ie doubling the `retryWaitInMs` on every retry.  Defaulted to `false`.

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

### Sending a message

Message objects must follow the below structure.

`body` - The body of the message.

`type` - Type of message using reverse DNS notation. For example, `uk.gov.demo.claim.validated`.

`subject` - Optional, if the body alone is not sufficient to give context to the recipient.  For example, `myImage.jpeg`.

`source` - Name of the service sending the message.  For example, `ffc-demo-claim-service`

`correlationId` - Optional, if distributed tracing through Application Insights is required.


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

#### Peek
Same as `receiveMessages` but does not mark the message as complete so it can still be received by other services once the peek lock expires.

```
const receiver = new EventReceiver(config, action)
// receive a maximum of 10 messages
messages = await receiver.peekMessages(10)

// shutdown when needed
await receiver.closeConnection()
```

### Handling a received message
Once a message is received through a peek lock, a response must be sent to Azure Service Bus before the lock expires otherwise Service Bus will resend the message.

If this is not the intended behaviour there are several responses that can be sent.

#### Complete
Message is complete and no further processing needed.

```
await receiver.completeMessage(message)
```

#### Dead Letter
Message cannot be processed by any client so should be added to dead letter queue.

```
await receiver.deadLetterMessage(message)
```

### Abandon
Abandon processing of current message so it can be redelivered, potentially to another client.

```
await receiver.abandonMessage(message)
```

### Defer
Defer message back to queue for later processing.  It will not be redelivered to any client unless the receiver command supplies the sequence number as an option.

[Further reading on deferring messages](https://docs.microsoft.com/en-gb/azure/service-bus-messaging/message-deferral)

```
// Defer
await receiver.deferMessage(message)
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
