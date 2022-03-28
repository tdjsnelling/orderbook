import React, { useState, useRef, useEffect } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const options = {
  chart: {
    type: 'area',
    zoomType: 'xy',
  },
  xAxis: {
    minPadding: 0,
    maxPadding: 0,
    // plotLines: [
    //   {
    //     color: '#888',
    //     value: 0.1523,
    //     width: 1,
    //     label: {
    //       text: 'Actual price',
    //       rotation: 90,
    //     },
    //   },
    // ],
    title: {
      text: 'Price',
    },
  },
  yAxis: [
    {
      lineWidth: 1,
      gridLineWidth: 1,
      title: null,
      tickWidth: 1,
      tickLength: 5,
      tickPosition: 'inside',
      labels: {
        align: 'left',
        x: 8,
      },
    },
    {
      opposite: true,
      linkedTo: 0,
      lineWidth: 1,
      gridLineWidth: 0,
      title: null,
      tickWidth: 1,
      tickLength: 5,
      tickPosition: 'inside',
      labels: {
        align: 'right',
        x: -8,
      },
    },
  ],
  legend: {
    enabled: false,
  },
  plotOptions: {
    area: {
      fillOpacity: 0.2,
      lineWidth: 1,
      step: 'center',
    },
  },
  tooltip: {
    headerFormat:
      '<span style="font-size=10px;">Price: {point.key}</span><br/>',
    valueDecimals: 2,
  },
}

const App = () => {
  const [socket, setSocket] = useState(null)
  const [symbol, setSymbol] = useState('AAA')
  const [data, setData] = useState({ buy: {}, sell: {} })
  const [tick, setTick] = useState(0)

  const fastData = useRef({ buy: {}, sell: {} })

  useEffect(() => {
    const sock = new WebSocket('ws://localhost:9697')
    setSocket(sock)

    setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)
  }, [])

  useEffect(() => {
    setData(fastData.current)
  }, [tick])

  useEffect(() => {
    const handleMessage = (message) => {
      const { data } = message
      const [event, order] = data.split('|')
      const [, eventType] = event.split(':')
      const [orderSide, orderSymbolAtPrice] = order.split(':')
      const [orderSymbol, orderPrice] = orderSymbolAtPrice.split('@')

      if (orderSymbol === symbol) {
        const oldData = { ...fastData.current }
        if (orderSide === '0') {
          fastData.current = {
            buy: {
              ...oldData.buy,
              [orderPrice]:
                (oldData.buy[orderPrice] || 0) +
                (eventType === 'rpush' ? 1 : -1),
            },
            sell: {
              ...oldData.sell,
            },
          }
        } else if (orderSide === '1') {
          fastData.current = {
            buy: {
              ...oldData.buy,
            },
            sell: {
              ...oldData.sell,
              [orderPrice]:
                (oldData.sell[orderPrice] || 0) +
                (eventType === 'rpush' ? 1 : -1),
            },
          }
        }
      }
    }

    setData({ buy: {}, sell: {} })
    if (socket) {
      socket.removeEventListener('message', handleMessage)
      socket.addEventListener('message', handleMessage)
    }
  }, [socket, symbol])

  return (
    <>
      <h1>orderbook</h1>
      <input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="Symbol"
      />
      <HighchartsReact
        highcharts={Highcharts}
        options={{
          ...options,
          title: {
            text: `${symbol} Market Depth`,
          },
          series: [
            {
              name: 'Bids',
              data: Object.entries(data.buy).map(([price, quantity]) => [
                parseInt(price),
                parseInt(quantity),
              ]),
              color: '#03a7a8',
            },
            {
              name: 'Asks',
              data: Object.entries(data.sell).map(([price, quantity]) => [
                parseInt(price),
                parseInt(quantity),
              ]),
              color: '#fc5857',
            },
          ],
        }}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  )
}

export default App
