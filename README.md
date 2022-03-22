# orderbook

Simple Node.js FIFO order matching engine, powered by Redis

## Running

```
$ yarn install
$ yarn build
$ yarn start
```

Ensure you also have a Redis server running.

### Environment variables

.env file will be picked up automatically.

```dotenv
# alternatively BASE_URL=ws://localhost
BASE_URL=wss://example.com

# default is 9696
PORT=5000

REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_AUTH=password
```

## Using

Once started, the server provides a websocket endpoint on the configured port.

When connecting to the websocket, the server expects a URL query parameter `user` to identify the connection. For example, you could connect to `wss://example.com/?user=alice`.

The engine itself provides no method for authentication. Any client can connect to the websocket with any unique ID. If an ID is already in use, new connections with the same ID will be rejected.

Once connected to, the endpoint expects messages in the format:

```
messageType|data
```

Where:
* `messageType` is an integer representing the type of message being sent, as defined in [src/handleMessage.js](https://github.com/tdjsnelling/orderbook/blob/master/src/handleMessage.js#L5)
* `data` is a base64 string containing the protobuf encoded message

### Message types

There are 3 different message types.

#### Order

The main message type used to push new orders. An order message consists of 4 parts:

* `uid`: the identifier of the user submitting the order
* `side`: whether the order is buy (0) or sell (1)
* `symbol`: the symbol or identifier of the item the order is for, e.g. 'BTC/GBP' or 'AAPL'
* `price`: the desired buy/sell price, in the smallest denomination. This field should not contain decimals

To submit an order, a protobuf message must be assembled from the above fields, and then sent as a base64 string, using the `order` message type.

##### Example

The order:

```json
{
  "uid": "alice",
  "side": 0,
  "symbol": "BTC/GBP",
  "price": 4088820
}
```

Should be sent as:

```
0|CgVhbGljZRAAGgNCVEMhAAAAAPoxT0E=
```

On the websocket you will receive a JSON result either saying your order has been submitted and is waiting to be matched or that it has been matched immediately.

If you have previously submitted an order and another client matches it, you will receive a similar JSON message on your open websocket.

#### Query

A query message allows you to see how many buy or sell orders currently exist for a particular symbol.

Query messages require a `uid`, `side`, and `symbol`.

You will receive a JSON response listing the number of buy or sell orders at each `price`.

For example, if the following orders are made:

```
buy BTC/GBP 1000
sell BTC/GBP 2000
buy BTC/GBP 1001
buy BTC/GBP 1000
```

Querying `buy BTC/GBP` would give the response:

```json
{
  "1000": 2,
  "1001": 1
}
```

And querying `sell BTC/GBP` would give the response:

```json
{
  "2000": 1
}
```

#### View

A view message allows you to view all buy or sell orders for a symbol at a specific price. This data includes the timestamp of when an order was placed and the ID of the client that placed it.

View messages require a `uid`, `side`, `symbol` and `price`. Additionally, they also require `start` and `stop` fields, integers determining how many orders should be returned.

A `start` of `0` and `stop` of `4` will return the first 5 orders, oldest first. `5 10` will return the next 5, and so on. If `stop` is greater than the max index, then `start` until the final order will be returned.

### Responses

Responses are JSON. They will always contain a `type` field, and either a `data` or `error` field.

## Order statistics

Redis also stores the fields `TOTAL_ORDERS` and `TOTAL_MATCHED` to track the number of orders processed.

## Example client

This repo provides a basic example client in `tools/client`.

It can be started with:

```
$ yarn client -s "ws://localhost:9696/?user=alice"
```

And then commands can be issued:

```
alice> order buy BTC/GBP 1000
alice> query buy BTC/GBP 1000
alice> view buy BTC/GBP 1000 0 0
```

## License

GNU GPL v3
