import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import protobuf from 'protobufjs'

import handleMessage from './handleMessage'
;(async () => {
  dotenv.config()

  const proto = await protobuf.load('src/proto/order.proto')
  const OrderMessage = proto.lookupType('orderbook.Order')

  const clients = {}
  const wss = new WebSocketServer({ port: process.env.PORT || 9696 })

  wss.on('connection', (ws, req) => {
    const [, uid] = req.url.split('/')

    ws.on('message', (message) => {
      const reply = handleMessage(uid, message, OrderMessage)
      if (reply) ws.send(JSON.stringify(reply))
    })

    ws.on('close', () => {
      console.log(`client disconnected: ${uid}`)
    })

    clients[uid] = ws
    console.log(`client connected: ${uid}`)
  })
})()
