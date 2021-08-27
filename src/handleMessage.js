const handleMessage = async ({ uid, buf, proto, redisClient }) => {
  const decoded = proto.decode(buf)
  const message = proto.toObject(decoded)

  if (uid !== message.uid) {
    console.log('message rejected: uid mismatch')
    return { error: 'User IDs do not match' }
  }

  console.log(`message: ${uid}: ${JSON.stringify(message)}`)

  const { side, symbol, price } = message

  await redisClient.RPUSH(
    `${side}:${symbol}@${price}`,
    JSON.stringify({ uid, ts: Date.now() })
  )
}

export default handleMessage
