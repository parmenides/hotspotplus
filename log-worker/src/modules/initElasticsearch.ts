import logger from '../utils/logger';
import elasticClient from '../utils/elastic';

const log = logger.createLogger();

export const addElasticIndexTemplates = async () => {
  try {
    const chargeResult = await elasticClient.indices.putTemplate({
      name: 'charge',
      body: getChargeIndexTemplate(),
    });
    log.debug('Charge index template added:', chargeResult);

    const accountingResult = await elasticClient.indices.putTemplate({
      name: 'accounting',
      body: getAccountingIndexTemplate(),
    });
    log.debug('Accounting index template added:', accountingResult);

    const sessionResult = await elasticClient.indices.putTemplate({
      name: 'session',
      body: getSessionIndexTemplate(),
    });
    log.debug('Session index template added:', sessionResult);

    const syslogResult = await elasticClient.indices.putTemplate({
      name: 'syslog',
      body: getSyslogIndexTemplate(),
    });
    log.debug('Syslog index template added:', syslogResult);

    const netflowResult = await elasticClient.indices.putTemplate({
      name: 'netflow',
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
          '@version': {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          geoip: {
            enabled: false,
            properties: {
              as_org: {
                enabled: false,
              },
              asn: {
                enabled: false,
              },
              autonomous_system: {
                enabled: false,
              },
              city_name: {
                enabled: false,
              },
              continent_code: {
                enabled: false,
              },
              country_code2: {
                enabled: false,
              },
              country_code3: {
                enabled: false,
              },
              country_name: {
                enabled: false,
              },
              dma_code: {
                enabled: false,
              },
              ip: {
                enabled: false,
              },
              latitude: {
                enabled: false,
              },
              location: {
                enabled: false,
                properties: {
                  lat: {
                    enabled: false,
                  },
                  lon: {
                    enabled: false,
                  },
                },
              },
              longitude: {
                enabled: false,
              },
              postal_code: {
                enabled: false,
              },
              region_code: {
                enabled: false,
              },
              region_name: {
                enabled: false,
              },
              timezone: {
                enabled: false,
              },
            },
          },
          geoip_dst: {
            enabled: false,
            properties: {
              as_org: {
                enabled: false,
              },
              asn: {
                enabled: false,
              },
              autonomous_system: {
                enabled: false,
              },
              city_name: {
                enabled: false,
              },
              continent_code: {
                enabled: false,
              },
              country_code2: {
                enabled: false,
              },
              country_code3: {
                enabled: false,
              },
              country_name: {
                enabled: false,
              },
              dma_code: {
                enabled: false,
              },
              ip: {
                enabled: false,
              },
              latitude: {
                enabled: false,
              },
              location: {
                enabled: false,
                properties: {
                  lat: {
                    enabled: false,
                  },
                  lon: {
                    enabled: false,
                  },
                },
              },

              longitude: {
                enabled: false,
              },
              postal_code: {
                enabled: false,
              },
              region_code: {
                enabled: false,
              },
              region_name: {
                enabled: false,
              },
              timezone: {
                enabled: false,
              },
            },
          },
          geoip_src: {
            enabled: false,
            properties: {
              as_org: {
                enabled: false,
              },
              asn: {
                enabled: false,
              },
              autonomous_system: {
                enabled: false,
              },
              city_name: {
                enabled: false,
              },
              continent_code: {
                enabled: false,
              },
              country_code2: {
                enabled: false,
              },
              country_code3: {
                enabled: false,
              },
              country_name: {
                enabled: false,
              },
              dma_code: {
                enabled: false,
              },
              ip: {
                enabled: false,
              },
              latitude: {
                enabled: false,
              },
              location: {
                enabled: false,
                properties: {
                  lat: {
                    enabled: false,
                  },
                  lon: {
                    enabled: false,
                  },
                },
              },
              longitude: {
                enabled: false,
              },
              postal_code: {
                enabled: false,
              },
              region_code: {
                enabled: false,
              },
              region_name: {
                enabled: false,
              },
              timezone: {
                enabled: false,
              },
            },
          },
          host: {
            type: 'keyword',
          },
          netflow: {
            properties: {
              bytes: {
                enabled: false,
              },
              direction: {
                enabled: false,
              },
              dst_addr: {
                type: 'keyword',
              },
              dst_as: {
                enabled: false,
              },
              dst_locality: {
                enabled: false,
              },
              dst_mask_len: {
                enabled: false,
              },
              dst_port: {
                type: 'long',
              },
              dst_port_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              engine_id: {
                enabled: false,
              },
              engine_type: {
                enabled: false,
              },
              first_switched: {
                enabled: false,
              },
              flow_locality: {
                enabled: false,
              },
              flow_records: {
                enabled: false,
              },
              flow_seq_num: {
                enabled: false,
              },
              input_snmp: {
                enabled: false,
              },
              ip_version: {
                enabled: false,
              },
              last_switched: {
                enabled: false,
              },
              next_hop: {
                enabled: false,
              },
              output_snmp: {
                enabled: false,
              },
              packets: {
                enabled: false,
              },
              protocol: {
                type: 'long',
              },
              protocol_name: {
                type: 'keyword',
              },
              sampling_algorithm: {
                enabled: false,
              },
              sampling_interval: {
                enabled: false,
              },
              src_addr: {
                type: 'keyword',
              },
              src_as: {
                enabled: false,
              },
              src_locality: {
                enabled: false,
              },
              src_mask_len: {
                enabled: false,
              },
              src_port: {
                type: 'long',
              },
              src_port_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              tcp_flag_tags: {
                enabled: false,
              },
              tcp_flags: {
                enabled: false,
              },
              tcp_flags_label: {
                enabled: false,
              },
              tos: {
                enabled: false,
              },
              version: {
                enabled: false,
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
