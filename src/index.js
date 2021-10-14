import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import { createClient } from 'redis'

import createMessageHandler from './handleMessage'

// iife
;(async () => {
  dotenv.config()

  const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_AUTH,
  })

  await redisClient.connect()

  const clients = {}
  const wss = new WebSocketServer({
    host: '0.0.0.0',
    port: process.env.PORT || 9696,
  })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, process.env.BASE_URL)
    const uid = url.searchParams.get('user')
    const key = url.searchParams.get('key')

    console.log(`connected:${uid}`)

    const handleMessage = createMessageHandler(uid, redisClient)

    ws.on('message', async (message) => {
      const reply = await handleMessage(message.toString())
      if (reply) {
        ws.send(JSON.stringify(reply))

        if (reply.type === 'match') {
          clients[reply.data.matchedBy].send(
            JSON.stringify({
              type: 'match',
              message: `Order matched`,
              data: {
                matchedBy: uid,
                matchedAt: reply.data.matchedAt,
                yourOrder: reply.data.matchedOrder,
                matchedOrder: reply.data.yourOrder,
              },
            })
          )
        }
      }
    })

    ws.on('close', () => {
      console.log(`disconnected:${uid}`)
    })

    clients[uid] = ws
  })
})()
