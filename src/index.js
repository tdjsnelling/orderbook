import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import { createClient } from 'redis'

import createMessageHandler from './handleMessage'

// iife
;(async () => {
  dotenv.config()

  let messagesPerSec = 0

  const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_AUTH,
  })

  await redisClient.connect()

  const wss = new WebSocketServer({
    host: '0.0.0.0',
    port: process.env.PORT || 9696,
  })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, process.env.BASE_URL)
    const uid = url.searchParams.get('user')

    ws.clientUid = uid
    console.log(`connected:${uid}`)

    const handleMessage = createMessageHandler(uid, redisClient)

    ws.on('message', async (message) => {
      const reply = await handleMessage(message.toString())
      if (reply) {
        ws.send(JSON.stringify(reply))

        if (reply.type === 'match') {
          const client = Array.from(wss.clients).find(
            (sock) => sock.clientUid === reply.data.matchedBy
          )
          if (client) {
            client.send(
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
          } else {
            console.log(`client lost: ${uid}`)
          }
        }
      }
      messagesPerSec += 1
    })

    ws.on('close', () => {
      console.log(`disconnected:${uid}`)
    })
  })

  setInterval(() => {
    if (messagesPerSec > 0) {
      console.log(`current load: ${messagesPerSec} messages/sec`)
      messagesPerSec = 0
    }
  }, 1000)
})()
