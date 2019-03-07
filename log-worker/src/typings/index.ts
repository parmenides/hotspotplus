//
export enum QUEUES {
  LOG_ENRICHMENT_WORKER_QUEUE = 'log-worker',
  LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE = 'log-worker-ex',
  RETRY_LOG_ENRICHMENT_WORKER_QUEUE = 'retry-log-worker',
  RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE = 'retry-log-worker-ex',
  LOG_WORKER_QUEUE = 'log-enrichment',
  LOG_WORKER_EXCHANGE = 'log-enrichment-ex',
  RETRY_LOG_WORKER_QUEUE = 'retry-log-enrichment',
  RETRY_LOG_WORKER_EXCHANGE = 'retry-log-enrichment-ex',
}
