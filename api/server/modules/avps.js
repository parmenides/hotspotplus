/**
 *
 * https://github.com/coova/coova-chilli/blob/master/doc/attributes
 * https://github.com/FreeRADIUS/freeradius-server/blob/v4.0.x/share/dictionary.chillispot
 */

module.exports = {
  nasId: 'NAS-Identifier',
  calledStationId: 'Called-Station-Id',
  engenius: {
    sessionTerminateTime: 'WISPr-Session-Terminate-Time',
    sessionTimeout: 'Session-Timeout',
    idleTimeout: 'Idle-Timeout',
    framedIpAddress: 'Framed-IP-Address',
    framedIpPool: 'Framed-Pool',
    framedIpNetmask: 'Framed-IP-Netmask',
    mac: 'Calling-Station-Id',
    speed: 'WISPr-Bandwidth-Max-Down',
    sessionId: 'Acct-Unique-Session-Id',
    nasSessionId: 'Acct-Session-Id',
    acctStatusType: 'Acct-Status-Type',
    uploadSpeed: 'WISPr-Bandwidth-Max-Up',
    downloadSpeed: 'WISPr-Bandwidth-Max-Down',
    bulk: 'ChilliSpot-Max-Total-Octets',
    upload: 'Acct-Input-Octets',
    download: 'Acct-Output-Octets',
    sessionTime: 'Acct-Session-Time',
    clearTextPass: 'Cleartext-Password',
    accountingUpdateInterval: 'Acct-Interim-Interval',
    replyMessage: 'Reply-Message',
    username: 'User-Name',
    password: 'User-Password',
    authType: 'Auth-Type',
    chap_challenge: 'CHAP-Challenge',
    chap_password: 'CHAP-Password',
    mschapv1_challenge: 'MS-CHAP-Challenge',
    mschapv1_password: 'MS-CHAP-Response',
    mschapv2_challenge: 'MS-CHAP-Challenge',
    mschapv2_password: 'MS-CHAP2-Response',
  },
  coovachilli: {
    sessionTerminateTime: 'WISPr-Session-Terminate-Time',
    sessionTimeout: 'Session-Timeout',
    idleTimeout: 'Idle-Timeout',
    framedIpAddress: 'Framed-IP-Address',
    framedIpPool: 'Framed-Pool',
    framedIpNetmask: 'Framed-IP-Netmask',
    mac: 'Calling-Station-Id',
    speed: 'WISPr-Bandwidth-Max-Down',
    sessionId: 'Acct-Unique-Session-Id',
    nasSessionId: 'Acct-Session-Id',
    acctStatusType: 'Acct-Status-Type',
    uploadSpeed: 'WISPr-Bandwidth-Max-Up',
    downloadSpeed: 'WISPr-Bandwidth-Max-Down',
    bulk: 'ChilliSpot-Max-Total-Octets',
    upload: 'Acct-Input-Octets',
    download: 'Acct-Output-Octets',
    sessionTime: 'Acct-Session-Time',
    clearTextPass: 'Cleartext-Password',
    accountingUpdateInterval: 'Acct-Interim-Interval',
    replyMessage: 'Reply-Message',
    username: 'User-Name',
    password: 'User-Password',
    authType: 'Auth-Type',
    chap_challenge: 'CHAP-Challenge',
    chap_password: 'CHAP-Password',
    mschapv1_challenge: 'MS-CHAP-Challenge',
    mschapv1_password: 'MS-CHAP-Response',
    mschapv2_challenge: 'MS-CHAP-Challenge',
    mschapv2_password: 'MS-CHAP2-Response',
  },
  mikrotik: {
    sessionTerminateTime: 'WISPr-Session-Terminate-Time',
    sessionTimeout: 'Session-Timeout',
    idleTimeout: 'Idle-Timeout',
    framedIpAddress: 'Framed-IP-Address',
    framedIpPool: 'Framed-Pool',
    framedIpNetmask: 'Framed-IP-Netmask',
    mac: 'Calling-Station-Id',
    speed: 'Mikrotik-Rate-Limit',
    sessionId: 'Acct-Unique-Session-Id',
    nasSessionId: 'Acct-Session-Id',
    acctStatusType: 'Acct-Status-Type',
    upload: 'Acct-Input-Octets',
    download: 'Acct-Output-Octets',
    sessionTime: 'Acct-Session-Time',
    bulk: 'Mikrotik-Xmit-Limit',
    clearTextPass: 'Cleartext-Password',
    accountingUpdateInterval: 'Acct-Interim-Interval',
    replyMessage: 'Reply-Message',
    username: 'User-Name',
    password: 'User-Password',
    authType: 'Auth-Type',
    chap_challenge: 'CHAP-Challenge',
    chap_password: 'CHAP-Password',
    mschapv1_challenge: 'MS-CHAP-Challenge',
    mschapv1_password: 'MS-CHAP-Response',
    mschapv2_challenge: 'MS-CHAP-Challenge',
    mschapv2_password: 'MS-CHAP2-Response',
    getRateLimit: function(
      rxRate,
      rxBurstRate,
      txRate,
      txBurstRate,
      burstTime,
    ) {
      // 64k/64k 256k/256k 128k/128k 10/10
      // 1024k/1024k 64k/64k 32k/32k 30/30
      // - rx/tx-rate=64000, rx/tx-burst-rate=256000, rx/tx-burst-threshold=128000, rx/tx-burst-time=10s
      if (rxBurstRate > 12000000 || txBurstRate > 12000000) {
        return rxRate + 'k';
      } else {
        return (
          rxRate +
          'k/' +
          txRate +
          'k ' +
          rxBurstRate +
          'k/' +
          txBurstRate +
          'k ' +
          Math.ceil(rxBurstRate / 2) +
          'k/' +
          Math.ceil(txBurstRate / 2) +
          'k ' +
          burstTime +
          '/' +
          burstTime
        );
      }
    },
  },
};
