var Syslogd = require('syslogd')
Syslogd(function(info) {
  /*
  info = {
        facility: 7
      , severity: 22
      , tag: 'tag'
      , time: Mon Dec 15 2014 10:58:44 GMT-0800 (PST)
      , hostname: 'hostname'
      , address: '127.0.0.1'
      , family: 'IPv4'
      , port: null
      , size: 39
      , msg: 'info'
  }
  */
  console.log(info);

}).listen(9000, function(err) {
  console.log(err)
  console.log('start')
})