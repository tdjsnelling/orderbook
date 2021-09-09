const matchOrder = async ({ side, symbol, price, redisClient }) => {
  const opposingSide = side === 0 ? 1 : 0
  const opposingKey = `${opposingSide}:${symbol}@${price}`

  const keys = await redisClient.KEYS(opposingKey)
  if (!keys) return null

  const ordersExist = (await redisClient.LLEN(opposingKey)) > 0
  if (!ordersExist) return null

  const matchedOrder = await redisClient.LPOP(opposingKey)
  return { order: opposingKey, ...JSON.parse(matchedOrder) }
}

export default matchOrder
