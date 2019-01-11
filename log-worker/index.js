/**
 * Created by payamyousefi on 11/21/17.
 */

var utility = require ( "hotspotplus-common" ).utility;
module.exports.netflowConsumer = require ( './modules/netflowConsumer' );
module.exports.syslogConsumer = require ( './modules/syslogConsumer' );
utility.installRaven ();