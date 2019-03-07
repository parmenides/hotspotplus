import logger from '../utils/logger';
import elasticClient from '../utils/elastic';

const log = logger.createLogger();

export const addSyslogIndexTemplates = async () => {
  try {
    const sessionResult = await elasticClient.indices.putTemplate({
      name: 'session',
      body: getSessionIndexTemplate(),
    });
    log.debug('session index template added:', sessionResult);
    const syslogResult = await elasticClient.indices.putTemplate({
      name: 'syslog',
      body: getSyslogIndexTemplate(),
    });

    log.debug('syslog index template added:', syslogResult);
    const netflowResult = await elasticClient.indices.putTemplate({
      name: 'netflow',
      body: getNetflowIndexTemplate(),
    });
    log.debug('netflow index template added:', netflowResult);
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
            type: 'ngram',
            min_gram: 3,
            max_gram: 3,
            token_chars: ['letter', 'digit'],
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
            type: 'text',
            fields: {
              ngram: {
                type: 'text',
                analyzer: 'full_text_ngram',
              },
            },
          },
          nasId: {
            type: 'keyword',
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
            properties: {
              as_org: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              asn: {
                type: 'long',
              },
              autonomous_system: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              city_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              continent_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              country_code2: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              country_code3: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              country_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              dma_code: {
                type: 'long',
              },
              ip: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              latitude: {
                type: 'float',
              },
              location: {
                properties: {
                  lat: {
                    type: 'float',
                  },
                  lon: {
                    type: 'float',
                  },
                },
              },
              longitude: {
                type: 'float',
              },
              postal_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              region_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              region_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              timezone: {
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
          geoip_dst: {
            properties: {
              as_org: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              asn: {
                type: 'long',
              },
              autonomous_system: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              city_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              continent_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              country_code2: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              country_code3: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              country_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              dma_code: {
                type: 'long',
              },
              ip: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              latitude: {
                type: 'float',
              },
              location: {
                properties: {
                  lat: {
                    type: 'float',
                  },
                  lon: {
                    type: 'float',
                  },
                },
              },
              longitude: {
                type: 'float',
              },
              postal_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              region_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              region_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              timezone: {
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
          geoip_src: {
            properties: {
              as_org: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              asn: {
                type: 'long',
              },
              autonomous_system: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              city_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              continent_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              country_code2: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              country_code3: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              country_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              dma_code: {
                type: 'long',
              },
              ip: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              latitude: {
                type: 'float',
              },
              location: {
                properties: {
                  lat: {
                    type: 'float',
                  },
                  lon: {
                    type: 'float',
                  },
                },
              },
              longitude: {
                type: 'float',
              },
              postal_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              region_code: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              region_name: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              timezone: {
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
          host: {
            type: 'keyword',
          },
          netflow: {
            properties: {
              bytes: {
                type: 'long',
              },
              direction: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              dst_addr: {
                type: 'keyword',
              },
              dst_as: {
                type: 'long',
              },
              dst_locality: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              dst_mask_len: {
                type: 'long',
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
                type: 'long',
              },
              engine_type: {
                type: 'long',
              },
              first_switched: {
                type: 'date',
              },
              flow_locality: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              flow_records: {
                type: 'long',
              },
              flow_seq_num: {
                type: 'long',
              },
              input_snmp: {
                type: 'long',
              },
              ip_version: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              last_switched: {
                type: 'date',
              },
              next_hop: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              output_snmp: {
                type: 'long',
              },
              packets: {
                type: 'long',
              },
              protocol: {
                type: 'long',
              },
              protocol_name: {
                type: 'keyword',
              },
              sampling_algorithm: {
                type: 'long',
              },
              sampling_interval: {
                type: 'long',
              },
              src_addr: {
                type: 'keyword',
              },
              src_as: {
                type: 'long',
              },
              src_locality: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              src_mask_len: {
                type: 'long',
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
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              tcp_flags: {
                type: 'long',
              },
              tcp_flags_label: {
                type: 'text',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                  },
                },
              },
              tos: {
                type: 'long',
              },
              version: {
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
            type: 'ngram',
            min_gram: 3,
            max_gram: 3,
            token_chars: ['letter', 'digit'],
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
            type: 'ngram',
            min_gram: 3,
            max_gram: 3,
            token_chars: ['letter', 'digit'],
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
          nasIp: {
            type: 'keyword',
          },
          username: {
            type: 'text',
            fields: {
              ngram: {
                type: 'text',
                analyzer: 'full_text_ngram',
              },
            },
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
          memberId: {
            type: 'keyword',
          },
          businessId: {
            type: 'keyword',
          },
          path: {
            type: 'text',
            analyzer: 'path_analyzer',
          },
          query: {
            type: 'text',
            fields: {
              ngram: {
                type: 'text',
                analyzer: 'full_text_ngram',
              },
            },
          },
          params: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          message: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          protocol: {
            type: 'keyword',
          },
          memberIp: {
            type: 'keyword',
          },
          method: {
            type: 'keyword',
          },
          url: {
            type: 'text',
            fields: {
              ngram: {
                type: 'text',
                analyzer: 'full_text_ngram',
              },
            },
          },
          domain: {
            type: 'text',
            analyzer: 'domain_name_analyzer',
          },
          hostGeoIp: {
            properties: {
              location: {
                type: 'geo_point',
              },
              timezone: { type: 'keyword' },
              city_name: { type: 'keyword' },
              country_name: { type: 'keyword' },
            },
          },
        },
      },
    },
  };
};
