import logger from '../utils/logger';
import elasticClient from '../utils/elastic';

const log = logger.createLogger();

export const addSyslogIndexTemplates = async () => {
  try {
    const result = await elasticClient.indices.putTemplate({
      name: 'syslog',
      body: getSyslogMappings(),
    });
    log.debug('syslog index template added:', result);
    return result;
  } catch (error) {
    log.error(error);
    throw error;
  }
};

const getSyslogMappings = () => {
  return {
    index_patterns: ['syslog*'],
    mappings: {
      doc: {
        properties: {
          timestamp: { type: 'date' },
          nasIp: { type: 'keyword' },
          path: { type: 'keyword' },
          query: { type: 'keyword' },
          params: { type: 'keyword' },
          message: { type: 'keyword' },
          protocol: { type: 'keyword' },
          memberIp: { type: 'keyword' },
          method: { type: 'keyword' },
          url: { type: 'keyword' },
          domain: { type: 'keyword' },
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
