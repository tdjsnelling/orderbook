import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import { createClient } from 'redis'

import createMessageHandler from './handleMessage'

// iife
;(async () => {
  dotenv.config()

  const redisClient = createClient({
    socket: {
      url: process.env.REDIS_URL,
    },
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

    const handleMessage = createMessageHandler(uid, redisClient)

    ws.on('message', async (message) => {
      const reply = await handleMessage(message.toString())
      if (reply) ws.send(JSON.stringify(reply))
    })

    ws.on('close', () => {
      console.log(`disconnected:${uid}`)
    })

    clients[uid] = ws
    console.log(`connected:${uid}`)
  })
})()
