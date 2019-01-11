/**
 * Created by rezanazari on 11/25/17.
 */

var utility = require ( "hotspotplus-common" ).utility;
module.exports.archiveService = require ( "./modules/archiveService" );
module.exports.accountingAggregator = require ( './modules/accountingAggregator' );
module.exports.cleanner = require ( './modules/cleanner' );
utility.installRaven ();