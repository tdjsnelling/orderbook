const { program } = require('commander')
import protobuf from 'protobufjs'
import WebSocket from 'ws'

program.version('0.0.1')
program.option('-s, --server <url>', 'server url')
program.parse(process.argv)
const options = program.opts()

const sideMap = {
  buy: 0,
  sell: 1,
}

const numberOfClients = 5
const sockets = Object.fromEntries(
  [...Array(numberOfClients)].map((_, i) => [`client${i}`, undefined])
)
const types = ['buy', 'sell']
const symbols = ['AAA', 'BBB', 'CCC']
const minPrice = 10
const maxPrice = 20

const pickRandom = (items) => {
  const index = Math.floor(Math.random() * items.length)
  return items[index]
}

const sendFromClient = (client, ws, OrderMessage) => {
  const randType = pickRandom(types)
  const randSymbol = pickRandom(symbols)
  const randPrice = Math.floor(Math.random() * (maxPrice - minPrice)) + minPrice

  const msg = OrderMessage.create({
    uid: client,
    side: sideMap[randType],
    symbol: randSymbol,
    price: randPrice,
  })
  const b64 = OrderMessage.encode(msg).finish().toString('base64')
  const toSend = JSON.stringify({ type: 'order', data: b64 })

  if (ws.readyState === 1) {
    console.log(`${client} sent ${randType}:${randSymbol}@${randPrice}`)
    ws.send(toSend)
  }

  setTimeout(() => {
    sendFromClient(client, ws, OrderMessage)
  }, 500)
}

for (const client in sockets) {
  console.log(`creating socket: ${options.server}/?user=${client}`)
  const ws = new WebSocket(`${options.server}/?user=${client}`)
  ws.on('open', async () => {
    console.log(`${client} open`)
    const proto = await protobuf.load('./src/proto/order.proto')
    const OrderMessage = proto.lookupType('orderbook.Order')
    sendFromClient(client, ws, OrderMessage)
  })
  sockets[client] = ws
}
