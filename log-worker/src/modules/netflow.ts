import logger, {createLogger} from '../utils/logger';
import _ from 'lodash';
import {
    NetflowReportRequestTask,
    LOCAL_TIME_ZONE,
    NetflowReportRequestTask,
    PROTOCOLS,
    DATABASE_DATE_FORMAT,
    REPORT_PERSIAN_DATE_FORMAT,
    REPORT_GREGORIAN_DATE_FORMAT,
} from '../typings';
import moment from 'moment';
import momentJ from 'moment-jalaali';
import momentTz from 'moment-timezone';
import {createClickConnection, executeClickQuery} from '../utils/clickClient';

const log = createLogger();

const clickHouse: any = createClickConnection();

const formatReports = (rows: ClickNetflowRow[]) => {
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

const createNetflowQuery = (
    netflowReportRequestTask: NetflowReportRequestTask,
) => {
    let mainQuery: string = ` SELECT * FROM logs.Session JOIN logs.Netflow ON Session.nasIp=Netflow.RouterAddr 
 AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(Netflow.TimeRecvd,INTERVAL 5 minute ) `;

    const whereParts: string[] = [
        ` (Session.framedIpAddress=Netflow.DstIP OR Session.framedIpAddress=Netflow.SrcIP OR Session.framedIpAddress=Netflow.NextHop) `
    ];
    if (netflowReportRequestTask.fromDate) {
        whereParts.push(
            ` TimeRecvd>=toDateTime('${netflowReportRequestTask.fromDate.format(
                DATABASE_DATE_FORMAT,
            )}') `,
        );
    }
    if (netflowReportRequestTask.toDate) {
        whereParts.push(
            ` TimeRecvd<=toDateTime('${netflowReportRequestTask.toDate.format(
                DATABASE_DATE_FORMAT,
            )}') `,
        );
    }
    if (netflowReportRequestTask.username) {
        whereParts.push(` username='${netflowReportRequestTask.username}' `);
    }
    if (
        netflowReportRequestTask.dstPort &&
        netflowReportRequestTask.dstPort.length > 0
    ) {
        const dstPortQueries: string[] = [];
        for (const dstPort of netflowReportRequestTask.dstPort) {
            dstPortQueries.push(` DstPort='${dstPort}' `);
        }
        whereParts.push(` (${dstPortQueries.join(' OR ')}) `);
    }
    if (
        netflowReportRequestTask.srcPort &&
        netflowReportRequestTask.srcPort.length > 0
    ) {
        const srcPortQueries: string[] = [];
        for (const srcPort of netflowReportRequestTask.srcPort) {
            srcPortQueries.push(` SrcPort='${srcPort}' `);
        }
        whereParts.push(` (${srcPortQueries.join(' OR ')}) `);
    }
    if (netflowReportRequestTask.businessId) {
        whereParts.push(` businessId='${netflowReportRequestTask.businessId}' `);
    }
    if (netflowReportRequestTask.nas && netflowReportRequestTask.nas.length > 0) {
        const nasIdQueries: string[] = [];
        for (const nas of netflowReportRequestTask.nas) {
            nasIdQueries.push(` nasId='${nas.id}' `);
        }
        whereParts.push(` (${nasIdQueries.join(' OR ')}) `);
    }
    if (netflowReportRequestTask.srcAddress) {
        whereParts.push(
            ` ( SrcIP='${netflowReportRequestTask.srcAddress}' OR NextHop='${
                netflowReportRequestTask.srcAddress
                }' ) `,
        );
    }
    if (netflowReportRequestTask.dstAddress) {
        whereParts.push(
            ` ( DstIP='${netflowReportRequestTask.dstAddress}' OR NextHop='${
                netflowReportRequestTask.dstAddress
                }' ) `,
        );
    }
    if (netflowReportRequestTask.protocol) {
        if (netflowReportRequestTask.protocol === PROTOCOLS.TCP) {
            whereParts.push(` Proto=6 `);
        } else if (netflowReportRequestTask.protocol === PROTOCOLS.UPD) {
            whereParts.push(` Proto=17 `);
        }
    }
    if (whereParts.length > 0) {
        mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;
    }
    return mainQuery;
};

interface NetflowReportResult {
    Router: string;
    Username: string;
    Mac: string;
    Jalali_Date: any;
    Src_Addr: string;
    Src_Port: string;
    Dst_Addr: string;
    Dst_Port: string;
    Protocol: string;
    Gregorian_Date: string;
}

const queryNetflow = async (
    netflowReportRequestTask: NetflowReportRequestTask,
): Promise<NetflowReportResult[]> => {
    const mainQuery = await createNetflowQuery(netflowReportRequestTask);
    log.debug(mainQuery);
    const {rows} = await executeClickQuery(clickHouse, mainQuery);
    const netflowRows = rows.map((row: any[]) => {
        return new ClickNetflowRow(row);
    });
    return formatReports(netflowRows);
};

export class ClickNetflowRow {
    public RouterAddr: string;
    public SrcIP: string;
    public DstIP: string;
    public SrcPort: string;
    public DstPort: string;
    public NextHop: string;
    public TimeRecvd: string;
    public businessId: string;
    public memberId: string;
    public nasId: string;
    public nasTitle: string;
    public nasIp: string;
    public username: string;
    public framedIpAddress: string;
    public mac: string;
    public creationDate: string;
    public Proto: number;

    constructor(row: any[]) {
        this.RouterAddr = row[0] && row[0].toString();
        this.SrcIP = row[1] && row[1].toString();
        this.DstIP = row[2] && row[2].toString();
        this.SrcPort = row[3] && row[3].toString();
        this.DstPort = row[4] && row[4].toString();
        this.NextHop = row[5] && row[5].toString();
        this.TimeRecvd = row[6] && row[6].toString();
        this.Proto = row[7] && (row[7] as number);
        this.businessId = row[8] && row[8].toString();
        this.memberId = row[9] && row[9].toString();
        this.nasId = row[10] && row[10].toString();
        this.nasTitle = row[11] && row[11].toString();
        this.nasIp = row[12] && row[12].toString();
        this.username = row[13] && row[13].toString();
        this.framedIpAddress = row[14] && row[14].toString();
        this.mac = row[15] && row[15].toString();
        this.creationDate = row[16] && row[16].toString();
    }

    public getJalaliDate() {
        return momentJ(moment.tz(this.TimeRecvd, '').tz(LOCAL_TIME_ZONE)).format(
            REPORT_PERSIAN_DATE_FORMAT,
        );
    }

    public getGregorianDate() {
        return moment
            .tz(this.TimeRecvd, '')
            .tz(LOCAL_TIME_ZONE)
            .format(REPORT_GREGORIAN_DATE_FORMAT);
    }

    public getProtocolString() {
        let protocolString = '';
        if (this.Proto === 6) {
            protocolString = PROTOCOLS.TCP;
        }
        if (this.Proto === 17) {
            protocolString = PROTOCOLS.UPD;
        }
        return protocolString;
    }
}

export default {
    queryNetflow,
};
