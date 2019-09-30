const ClickHouse = require('@apla/clickhouse')
const clickHouseClient = new ClickHouse({
  host: '127.0.0.1',
  port: 8123,
  user: 'admin',
  password: '123',
})

const stream = clickHouseClient.query(`select sum(amount) from accounting.Charge`)

stream.on('error', function (err) {
  console.log(err)
})
stream.on('data', (row) => {
  row=[10,20,30,40];
  const total = row.reduce(function(acc,current){
    console.log('acc:',acc)
    console.log('current:',current)
    return acc + current
  })
  console.log(total)
});
//const charge = { "_id":"17bac67b-361a-4b26-bb62-53360306596c", "businessId":"dsfsdfsf", "amount": 100, "forThe":"123123", "type": "charge", "creationDate": "2018-02-07T11:33:14" }
//console.log(JSON.stringify(charge));
//stream.write(['17bac67b-361a-4b26-bb62-53360306596c','12','charge','hhhh',1000,'2018-02-07T11:33:14'])

