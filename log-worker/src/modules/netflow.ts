import logger from '../utils/logger';

import { ClickHouseQueryResult, NetflowReportRequestTask } from '../typings';
import _ from 'lodash';
import clickhouse from './clickhouse';

const log = logger.createLogger();

const getNetflowReports = async (
  reportRequestTask: NetflowReportRequestTask,
) => {
  const { rows, columns } = await clickhouse.queryNetflow(reportRequestTask);
  return formatReports({ rows, columns });
};

const formatReports = (options: ClickHouseQueryResult) => {
  const { rows, columns } = options;

  const formatted = rows.map((clickRow) => {
    return {
      Router: clickRow.nasTitle,
      Username: clickRow.username,
      Mac: clickRow.mac,
      Jalali_Date: clickRow.getJalaliDate(),
      Src_Addr: clickRow.SrcIP,
      Src_Port: clickRow.SrcPort,
      Dst_Addr: clickRow.DstIP,
      Dst_Port: clickRow.DstPort,
      Protocol: clickRow.getProtocolString(),
      Gregorian_Date: clickRow.getGregorianDate(),
    };
  });
  return _.sortBy(formatted, ['Router', 'Username', 'Jalali_Date']);
};

export default {
  getNetflowReports,
};
