const handleMessage = (uid, buf, OrderMessage) => {
  const decoded = OrderMessage.decode(buf)
  const message = OrderMessage.toObject(decoded)

  if (uid !== message.uid) {
    console.log('message rejected: uid mismatch')
    return { error: 'User IDs do not match' }
  }

  console.log(`message: ${uid}: ${JSON.stringify(message)}`)
}

export default handleMessage
