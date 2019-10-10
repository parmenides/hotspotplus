const uuidv4 = require('uuid/v4');
const Q = require('q');
const logger = require('./logger');
const log = logger.createLogger();
const DB = require('./db');
const ClickHouse = require('@apla/clickhouse');
const moment = require('moment');
const config = require('./config');

module.exports = DB(insert, query, uuidv4, config, moment, log);

function createClickHouseClient() {
  return new ClickHouse({
    host: process.env.CLICK_HOST,
    port: process.env.CLICK_PORT || 8123,
    user: process.env.CLICK_USER,
    password: process.env.CLICK_PASSWORD,
  });
}

function insert(dbName, data) {
  return Q.Promise((resolve, reject) => {
    const clickHouseClient = createClickHouseClient();
    const stream = clickHouseClient.query(`INSERT INTO ${dbName} `, {inputFormat: 'TSV'}, function(error) {
      if (error) {
        log.error('insert to clickhouse failed', data);
        return reject(error);
      }
      log.debug('data saved:', data);
      return resolve();
    });
    stream.write(data);
    stream.end();
  });
}

function query(mainQuery) {
  return Q.Promise((resolve, reject) => {
    const clickHouseClient = createClickHouseClient();
    const stream = clickHouseClient.query(mainQuery);
    let columns = [];
    stream.on('metadata', (columnsInfo) => {
      log.debug('row meta:', columnsInfo);
      columns = columnsInfo;
    });

    const rows = [];
    stream.on('data', (row) => {
      rows.push(row);
    });

    stream.on('error', (error) => {
      reject(error);
    });

    stream.on('end', () => {
      const result = rows.map((row) => {
        const jsonRow = {};
        for (let i = 0; i < columns.length; i++) {
          const value = row[i];
          const {type, name} = columns[i];
          if (type === 'DateTime' || type === 'Date') {
            jsonRow[name] = moment(value).toDate().getTime();
          } else {
            jsonRow[name] = value;
          }
        }
        return jsonRow;
      });
      resolve(result);
    });
  });
}
