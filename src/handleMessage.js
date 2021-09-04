import protobuf from 'protobufjs'

const createMessageHandler = (uid, redisClient) => async (rawMessage) => {
  const json = JSON.parse(rawMessage)
  const { type, data } = json

  const proto = await protobuf.load('src/proto/order.proto')

  console.log(`message:${uid}:${type}`)

  switch (type) {
    case 'order':
      return await handleOrder({ data, uid, proto, redisClient })
    case 'query':
      return await handleQuery({ data, uid, proto, redisClient })
    case 'view':
      return await handleView({ data, uid, proto, redisClient })
    default:
      return { error: `Message type “${type}” unknown` }
  }
}

const handleOrder = async ({ data, uid, proto, redisClient }) => {
  const OrderMessage = proto.lookupType('orderbook.Order')

  const buf = Buffer.from(data, 'base64')
  const decoded = OrderMessage.decode(buf)
  const message = OrderMessage.toObject(decoded)

  if (uid !== message.uid) {
    console.log('message rejected: uid mismatch')
    return { type: 'order', error: 'User IDs do not match' }
  }

  const { side, symbol, price } = message

  const ts = Date.now()
  const orderString = `${side}:${symbol}@${price}`
  console.log(`order:${uid}:${orderString}`)

  await redisClient.RPUSH(orderString, JSON.stringify({ uid, ts }))

  return { type: 'order', message: `Order submitted at ${ts}` }
}

const handleQuery = async ({ data, uid, proto, redisClient }) => {
  const OrderMessage = proto.lookupType('orderbook.Query')

  const buf = Buffer.from(data, 'base64')
  const decoded = OrderMessage.decode(buf)
  const message = OrderMessage.toObject(decoded)

  if (uid !== message.uid) {
    console.log('message rejected: uid mismatch')
    return { type: 'order', error: 'User IDs do not match' }
  }

  const { side, symbol } = message

  const keys = await redisClient.KEYS(`${side}:${symbol}*`)
  const lists = {}

  for (const key of keys) {
    const [, price] = key.split('@')
    lists[price] = await redisClient.LLEN(key)
  }

  return { type: 'query', data: lists }
}

const handleView = async ({ data, uid, proto, redisClient }) => {
  const OrderMessage = proto.lookupType('orderbook.View')

  const buf = Buffer.from(data, 'base64')
  const decoded = OrderMessage.decode(buf)
  const message = OrderMessage.toObject(decoded)

  if (uid !== message.uid) {
    console.log('message rejected: uid mismatch')
    return { type: 'order', error: 'User IDs do not match' }
  }

  const { side, symbol, price, start, stop } = message

  const orders = await redisClient.LRANGE(
    `${side}:${symbol}@${price}`,
    start,
    stop
  )

  return { type: 'query', data: JSON.parse(orders) }
}

export default createMessageHandler
