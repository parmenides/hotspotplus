//const charge = { "_id":"17bac67b-361a-4b26-bb62-53360306596c", "businessId":"dsfsdfsf", "amount": 100, "forThe":"123123", "type": "charge", "creationDate": "2018-02-07T11:33:14" }
//console.log(JSON.stringify(charge));
//stream.write(['17bac67b-361a-4b26-bb62-53360306596c','12','charge','hhhh',1000,'2018-02-07T11:33:14'])
const ClickHouse = require('@apla/clickhouse')
const clickHouseClient = new ClickHouse({
  host: '127.0.0.1',
  port: 8123,
  user: 'admin',
  password: '123',
})

const stream = clickHouseClient.query(`select sessionId,sum(upload)as upload from hotspotplus.Usage group by sessionId`)

stream.on('error', function (err) {
  console.log(err)
})
stream.on('data', (row) => {
  console.log(row)
});

var redis = require('redis')
var redisClient = redis.createClient()

redisClient.hmset('ali', 'downmoad', 500, 'sessionTime', 200000, (error, result) => {
  console.log(error)
  console.log(result)
  redisClient.hincrby('ali','downmoad',1, (error, result) => {
    console.log(error)
    console.log(result)

    redisClient.hgetall('ali', (error, result) => {
      console.log(error)
      console.log(result)

    })
  })

})

