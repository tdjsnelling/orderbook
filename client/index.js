const { program } = require('commander')
import inquirer from 'inquirer'
import protobuf from 'protobufjs'
import WebSocket from 'ws'

program.version('0.0.1')
program.option('-s, --server <url>', 'server url')
program.parse(process.argv)
const options = program.opts()

const ui = new inquirer.ui.BottomBar()

const sideMap = {
  buy: 0,
  sell: 1,
}

const ws = new WebSocket(options.server)
ws.on('message', async (message) => {
  ui.log.write(`< ${message}`)
})

const url = new URL(options.server)
const uid = url.searchParams.get('user')

const send = (Message, type, payload) => {
  const msg = Message.create(payload)
  const b64 = Message.encode(msg).finish().toString('base64')
  const toSend = JSON.stringify({ type, data: b64 })
  ui.log.write(`> ${toSend}`)
  ws.send(toSend)
}

const readCmd = async () => {
  const proto = await protobuf.load('./src/proto/order.proto')

  const { cmd } = await inquirer.prompt([
    {
      name: 'cmd',
      message: `${uid}>`,
    },
  ])

  const tokens = cmd.split(' ')
  const [type, ...rest] = tokens

  if (type === 'order') {
    const [side, symbol, price] = rest
    const OrderMessage = proto.lookupType('orderbook.Order')
    send(OrderMessage, type, {
      uid,
      side: sideMap[side],
      symbol,
      price,
    })
  } else if (type === 'query') {
    const [side, symbol] = rest
    const QueryMessage = proto.lookupType('orderbook.Query')
    send(QueryMessage, type, {
      uid,
      side: sideMap[side],
      symbol,
    })
  } else if (type === 'view') {
    const [side, symbol, price, start, stop] = rest
    const ViewMessage = proto.lookupType('orderbook.View')
    send(ViewMessage, type, {
      uid,
      side: sideMap[side],
      symbol,
      price,
      start,
      stop,
    })
  }

  await readCmd()
}

readCmd()
