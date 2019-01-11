/**
 * Created by payamyousefi on 11/21/17.
 */

var utility = require ( "./src/modules/utility" );
module.exports.netflowConsumer = require ( './src/netflowConsumer' );
module.exports.syslogConsumer = require ( './src/syslogConsumer' );
utility.installRaven ();