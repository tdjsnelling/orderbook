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
  const wss = new WebSocketServer({ port: process.env.PORT || 9696 })

  wss.on('connection', (ws, req) => {
    const [, uid] = req.url.split('/')

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
