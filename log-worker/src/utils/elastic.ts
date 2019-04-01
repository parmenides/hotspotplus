import elasticsearch from 'elasticsearch';
const elastic = new elasticsearch.Client({
  // @ts-ignore
  hosts: `${process.env.ELASTIC_IP}:${process.env.ELASTIC_PORT}`,
  apiVersion: '6.6',
  log: process.env.ELASTICSEARCH_LOG_LEVEL || 'info',
});

export default elastic;
