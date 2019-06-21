import logger from '../utils/logger';
import elasticClient from '../utils/elastic';

const log = logger.createLogger();
const CHARGE_INDEX_NAME = 'charge';
const ACCOUNTING_INDEX_NAME = 'accounting';
const NETFLOW_INDEX_NAME = 'netflow';
const SYSLOG_INDEX_NAME = 'syslog';
const SESSION_INDEX_NAME = 'session';

export const addDefaultIndex = async () => {
  if (!process.env.ELASTIC_INDEX_PREFIX) {
    throw new Error('ELASTIC_INDEX_PREFIX is empty');
  }
  try {
    const defaultIndexNames = [
      process.env.ELASTIC_INDEX_PREFIX + 'accounting',
      process.env.ELASTIC_INDEX_PREFIX + 'charge',
      process.env.ELASTIC_INDEX_PREFIX + 'licensecharge',
      process.env.ELASTIC_LICENSE_INDEX_PREFIX + 'licensecharge',
      process.env.ELASTIC_INDEX_PREFIX + 'session',
    ];
    for (const index of defaultIndexNames) {
      const indexExist = await elasticClient.indices.exists({
        index,
      });
      if (!indexExist) {
        await elasticClient.indices.create({
          index,
        });
        log.debug(`${index} index added`);
      }
    }
  } catch (error) {
    log.error('failed to add default indexes');
    log.error(error);
    throw error;
  }
};

export const addElasticIndexTemplates = async () => {
  try {
    const chargeResult = await elasticClient.indices.putTemplate({
      name: CHARGE_INDEX_NAME,
      body: getChargeIndexTemplate(),
    });
    log.debug('Charge index template added:', chargeResult);

    const accountingResult = await elasticClient.indices.putTemplate({
      name: ACCOUNTING_INDEX_NAME,
      body: getAccountingIndexTemplate(),
    });
    log.debug('Accounting index template added:', accountingResult);

    const sessionResult = await elasticClient.indices.putTemplate({
      name: SESSION_INDEX_NAME,
      body: getSessionIndexTemplate(),
    });
    log.debug('Session index template added:', sessionResult);

    const syslogResult = await elasticClient.indices.putTemplate({
      name: SYSLOG_INDEX_NAME,
      body: getSyslogIndexTemplate(),
    });
    log.debug('Syslog index template added:', syslogResult);

    const netflowResult = await elasticClient.indices.putTemplate({
      name: NETFLOW_INDEX_NAME,
      body: getNetflowIndexTemplate(),
    });
    log.debug('Netflow index template added:', netflowResult);
  } catch (error) {
    log.error(error);
    throw error;
  }
};

const getNetflowIndexTemplate = () => {
  return {
    index_patterns: ['netflow*'],
    settings: {
      analysis: {
        normalizer: {
          lowercase_normalizer: {
            type: 'custom',
            char_filter: [],
            filter: ['lowercase'],
          },
        },
        analyzer: {
          full_text_ngram: {
            tokenizer: 'ngram_tokenizer',
          },
          domain_name_analyzer: {
            filter: 'lowercase',
            tokenizer: 'domain_name_tokenizer',
            type: 'custom',
          },
          path_analyzer: {
            tokenizer: 'path_tokenizer',
          },
        },
        tokenizer: {
          ngram_tokenizer: {
            type: 'nGram',
            min_gram: 3,
            max_gram: 12,
            token_chars: ['letter', 'digit', 'punctuation', 'symbol'],
          },
          domain_name_tokenizer: {
            type: 'PathHierarchy',
            delimiter: '.',
            reverse: true,
          },
          path_tokenizer: {
            type: 'path_hierarchy',
            delimiter: '-',
            replacement: '/',
            skip: 2,
          },
        },
      },
    },
    mappings: {
      doc: {
        properties: {
          username: {
            type: 'keyword',
            normalizer: 'lowercase_normalizer',
          },
          nasId: {
            type: 'keyword',
          },
          nasTitle: {
            enabled: false,
          },
          mac: {
            type: 'keyword',
            normalizer: 'lowercase_normalizer',
          },
          status: {
            type: 'keyword',
          },
          enrichDate: {
            type: 'date',
          },
          memberId: {
            type: 'keyword',
          },
          businessId: {
            type: 'keyword',
          },
          '@timestamp': {
            type: 'date',
          },
          host: {
            type: 'keyword',
          },
          netflow: {
            properties: {
              bytes: {
                enabled: false,
              },
              version: {
                enabled: false,
              },
              dst_addr: {
                type: 'keyword',
              },
              dst_port: {
                type: 'long',
              },
              protocol: {
                type: 'long',
              },
              src_addr: {
                type: 'keyword',
              },
              ipv4_next_hop: {
                type: 'keyword',
              },
              src_port: {
                type: 'long',
              },
            },
          },
          tags: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          type: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
        },
      },
    },
  };
};

const getChargeIndexTemplate = () => {
  return {
    index_patterns: ['*charge*'],
    mappings: {
      doc: {
        properties: {
          timestamp: { type: 'date' },
          businessId: { type: 'keyword' },
          forThe: { type: 'keyword' },
          type: { type: 'keyword' },
          amount: { type: 'integer' },
          date: { type: 'long' },
        },
      },
    },
  };
};

const getAccountingIndexTemplate = () => {
  return {
    index_patterns: ['*accounting*'],
    mappings: {
      doc: {
        properties: {
          timestamp: { type: 'date' },
          businessId: { type: 'keyword' },
          memberId: { type: 'keyword' },
          sessionId: { type: 'keyword' },
          nasId: { type: 'keyword' },
          mac: { type: 'keyword' },
          creationDate: { type: 'long' },
          sessionTime: { type: 'long' },
          totalUsage: { type: 'long' },
          download: { type: 'long' },
          upload: { type: 'long' },
        },
      },
    },
  };
};

const getSessionIndexTemplate = () => {
  return {
    index_patterns: ['*session*'],
    settings: {
      analysis: {
        analyzer: {
          full_text_ngram: {
            tokenizer: 'ngram_tokenizer',
          },
          domain_name_analyzer: {
            filter: 'lowercase',
            tokenizer: 'domain_name_tokenizer',
            type: 'custom',
          },
          path_analyzer: {
            tokenizer: 'path_tokenizer',
          },
        },
        tokenizer: {
          ngram_tokenizer: {
            type: 'nGram',
            min_gram: 3,
            max_gram: 12,
            token_chars: ['letter', 'digit', 'punctuation', 'symbol'],
          },
          domain_name_tokenizer: {
            type: 'PathHierarchy',
            delimiter: '.',
            reverse: true,
          },
          path_tokenizer: {
            type: 'path_hierarchy',
            delimiter: '-',
            replacement: '/',
            skip: 2,
          },
        },
      },
    },
    mappings: {
      doc: {
        properties: {
          timestamp: { type: 'date' },
          creationDate: { type: 'long' },
          businessId: { type: 'keyword' },
          memberId: { type: 'keyword' },
          nasId: { type: 'keyword' },
          nasTitle: { enabled: false },
          nasIp: { type: 'keyword' },
          groupIdentity: { type: 'keyword' },
          groupIdentityId: { type: 'keyword' },
          groupIdentityType: { type: 'keyword' },
          mac: { type: 'keyword' },
          username: { type: 'keyword' },
          framedIpAddress: { type: 'keyword' },
        },
      },
    },
  };
};

const getSyslogIndexTemplate = () => {
  return {
    index_patterns: ['syslog*'],
    settings: {
      analysis: {
        normalizer: {
          lowercase_normalizer: {
            type: 'custom',
            char_filter: [],
            filter: ['lowercase'],
          },
        },
        analyzer: {
          full_text_ngram: {
            tokenizer: 'ngram_tokenizer',
            type: 'custom',
            filter: ['lowercase'],
          },
          domain_name_analyzer: {
            filter: 'lowercase',
            tokenizer: 'domain_name_tokenizer',
            type: 'custom',
          },
          path_analyzer: {
            tokenizer: 'path_tokenizer',
          },
        },
        tokenizer: {
          ngram_tokenizer: {
            type: 'nGram',
            min_gram: 3,
            max_gram: 12,
            token_chars: ['letter', 'digit', 'punctuation', 'symbol'],
          },
          domain_name_tokenizer: {
            type: 'PathHierarchy',
            delimiter: '.',
            reverse: true,
          },
          path_tokenizer: {
            type: 'path_hierarchy',
            delimiter: '-',
            replacement: '/',
            skip: 2,
          },
        },
      },
    },

    mappings: {
      doc: {
        properties: {
          timestamp: {
            type: 'date',
          },
          nasIp: {
            type: 'keyword',
          },
          username: {
            type: 'keyword',
            normalizer: 'lowercase_normalizer',
          },
          status: {
            type: 'keyword',
          },
          enrichDate: {
            type: 'date',
          },
          nasId: {
            type: 'keyword',
          },
          nasTitle: {
            enabled: false,
          },
          memberId: {
            type: 'keyword',
          },
          businessId: {
            type: 'keyword',
          },
          path: {
            enabled: false,
          },
          query: {
            enabled: false,
          },
          params: {
            enabled: false,
          },
          message: {
            enabled: false,
          },
          protocol: {
            type: 'keyword',
            normalizer: 'lowercase_normalizer',
          },
          memberIp: {
            type: 'keyword',
          },
          method: {
            type: 'keyword',
            normalizer: 'lowercase_normalizer',
          },
          url: {
            type: 'keyword',
            normalizer: 'lowercase_normalizer',
          },
          domain: {
            type: 'keyword',
            normalizer: 'lowercase_normalizer',
          },
          hostGeoIp: {
            enabled: false,
            properties: {
              location: {
                enabled: false,
              },
              timezone: {
                enabled: false,
              },
              city_name: {
                enabled: false,
              },
              country_name: {
                enabled: false,
              },
            },
          },
        },
      },
    },
  };
};
