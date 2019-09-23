import { RequestHandler } from 'express';
import logger from '../utils/logger';
import {
  DnsReportRequestTask,
  LOGGER_TIME_ZONE,
  NetflowReportRequestTask,
  REPORT_TYPE,
  WebproxyReportRequestTask,
} from '../typings';
import netflow from '../modules/netflow';
const log = logger.createLogger();
import momentTz = require('moment-timezone');
import { getReportConfig } from '../reportEngine/reportTypes';
import * as fs from 'fs';
import render from '../reportEngine';
import { file as tmpFile } from 'tmp-promise';
import dns from '../modules/dns';
import webproxy from '../modules/webproxy';

const controller: { [key: string]: RequestHandler } = {
  health: (request, response) => {
    response.send({ ok: true });
  },
  searchNetflow: async (request, response) => {
    let {
      to,
      limit,
      from,
      skip,
    }: {
      from: number;
      to: number;
      limit: number;
      skip: number;
    } = request.query;
    const {
      type,
      departments,
      businessId,
      username,
      srcAddress,
      srcPort,
      dstAddress,
      dstPort,
    }: {
      type: string;
      departments: string[];
      businessId: string;
      username: string;
      srcAddress: string;
      srcPort: string;
      dstAddress: string;
      dstPort: string;
    } = request.query;

    from = Number(from);
    to = Number(to);
    skip = Number(skip);
    limit = Number(limit);

    log.debug(request.body);

    const netflowReportRequestTask: NetflowReportRequestTask = {
      type,
      fromDate: momentTz.tz(from, LOGGER_TIME_ZONE),
      toDate: momentTz.tz(to, LOGGER_TIME_ZONE),
      departments,
      username,
      businessId,
      srcAddress,
      dstAddress,
      srcPort,
      dstPort,
      limit,
      skip,
    };

    log.debug(
      `Create netflow report from ${netflowReportRequestTask.fromDate} to ${
        netflowReportRequestTask.toDate
      }`,
      JSON.stringify(netflowReportRequestTask),
    );

    try {
      if (type === 'json') {
        const result = await netflow.query('json', netflowReportRequestTask);
        result.data = netflow.formatJson(result.data);
        response.send(result);
      } else if (type === 'excel') {
        const result = await netflow.query('json', netflowReportRequestTask);
        result.data = netflow.formatJson(result.data);
        const reportConfig = getReportConfig(REPORT_TYPE.NETFLOW);
        const report = await render(reportConfig, { netflow: result.data });
        const reportFile = await tmpFile();
        const writable = fs.createWriteStream(reportFile.path);
        await report.stream.pipe(writable);
        writable.on('finish', () => {
          response.sendFile(reportFile.path);
        });
        writable.on('error', (e) => {
          log.error(e);
        });
      } else {
        throw new Error('unknown report type');
      }
    } catch (e) {
      log.error(e);
      throw e;
    }
  },
  searchDns: async (request, response) => {
    let {
      to,
      limit,
      from,
      skip,
    }: {
      from: number;
      to: number;
      limit: number;
      skip: number;
    } = request.query;
    const {
      type,
      departments,
      businessId,
      username,
    }: {
      type: string;
      departments: string[];
      businessId: string;
      username: string;
    } = request.query;

    from = Number(from);
    to = Number(to);
    skip = Number(skip);
    limit = Number(limit);

    log.debug(request.body);

    const dnsReportRequestTask: DnsReportRequestTask = {
      type,
      fromDate: momentTz.tz(from, LOGGER_TIME_ZONE),
      toDate: momentTz.tz(to, LOGGER_TIME_ZONE),
      departments,
      username,
      businessId,
      limit,
      skip,
    };

    log.debug(
      `Create dns report from ${dnsReportRequestTask.fromDate} to ${
        dnsReportRequestTask.toDate
      }`,
      JSON.stringify(dnsReportRequestTask),
    );

    try {
      if (type === 'json') {
        const result = await dns.query('json', dnsReportRequestTask);
        result.data = dns.formatJson(result.data);
        response.send(result);
      } else if (type === 'excel') {
        const result = await dns.query('json', dnsReportRequestTask);
        result.data = dns.formatJson(result.data);
        const reportConfig = getReportConfig(REPORT_TYPE.DNS);
        const report = await render(reportConfig, { dns: result.data });
        const reportFile = await tmpFile();
        const writable = fs.createWriteStream(reportFile.path);
        await report.stream.pipe(writable);
        writable.on('finish', () => {
          response.sendFile(reportFile.path);
        });
        writable.on('error', (e) => {
          log.error(e);
        });
      } else {
        throw new Error('unknown report type');
      }
    } catch (e) {
      log.error(e);
      throw e;
    }
  },
  searchWebproxy: async (request, response) => {
    let {
      to,
      limit,
      from,
      skip,
    }: {
      from: number;
      to: number;
      limit: number;
      skip: number;
    } = request.query;
    const {
      type,
      departments,
      businessId,
      domain,
      url,
      username,
    }: {
      type: string;
      departments: string[];
      businessId: string;
      domain: string;
      url: string;
      username: string;
    } = request.query;

    from = Number(from);
    to = Number(to);
    skip = Number(skip);
    limit = Number(limit);

    log.debug(request.body);

    const webproxyReportRequestTask: WebproxyReportRequestTask = {
      type,
      fromDate: momentTz.tz(from, LOGGER_TIME_ZONE),
      toDate: momentTz.tz(to, LOGGER_TIME_ZONE),
      departments,
      username,
      domain,
      url,
      businessId,
      limit,
      skip,
    };

    log.debug(
      `Create webproxy report from ${webproxyReportRequestTask.fromDate} to ${
        webproxyReportRequestTask.toDate
      }`,
      JSON.stringify(webproxyReportRequestTask),
    );

    try {
      if (type === 'json') {
        const result = await webproxy.query('json', webproxyReportRequestTask);
        result.data = webproxy.formatJson(result.data);
        response.send(result);
      } else if (type === 'excel') {
        const result = await webproxy.query('json', webproxyReportRequestTask);
        result.data = webproxy.formatJson(result.data);
        const reportConfig = getReportConfig(REPORT_TYPE.WEBPROXY);
        const report = await render(reportConfig, { webproxy: result.data });
        const reportFile = await tmpFile();
        const writable = fs.createWriteStream(reportFile.path);
        await report.stream.pipe(writable);
        writable.on('finish', () => {
          response.sendFile(reportFile.path);
        });
        writable.on('error', (e) => {
          log.error(e);
        });
      } else {
        throw new Error('unknown report type');
      }
    } catch (e) {
      log.error(e);
      throw e;
    }
  },
};

export default controller;
