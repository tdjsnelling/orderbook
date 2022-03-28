import express from 'express'
import * as React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import App from './app'

const app = express()

app.use(express.static('tools/chart/dist'))

app.get('*', (req, res) => {
  let app = ''
  try {
    app = ReactDOMServer.renderToString(<App />)
  } catch (e) {
    console.error(e)
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>orderbook</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>" />
        <script src="/app.js" async defer></script>
      </head>
      <body>
        <div id="root">${app}</div>
      </body>
    </html>`

  res.send(html)
})

const PORT = (process.env.PORT || 9696) + 2
app.listen(PORT, () => {
  console.log(`React app running at http://localhost:${PORT}`)
})
