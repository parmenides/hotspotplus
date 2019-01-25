var kafka = require ( 'kafka-node' );
require ( 'date-utils' );
var ZOOKEEPER_IP = "172.20.0.81";
var ZOOKEEPER_PORT = "2181";


var consumerGroupOptions = {
	host:           ZOOKEEPER_IP + ":" + ZOOKEEPER_PORT,  // zookeeper host omit if connecting directly to broker (see kafkaHost below)
	groupId:        'RawAccountingConsumerGroup',
	sessionTimeout: 15000,
	// An array of partition assignment protocols ordered by preference.
	// 'roundrobin' or 'range' string for built ins (see below to pass in custom assignment protocol)
	protocol:       [ 'roundrobin' ],

	// Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved)
	// equivalent to Java client's auto.offset.reset
	fromOffset:               'latest', // default
	commitOffsetsOnFirstJoin: true, // on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest)
	// how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset
	outOfRangeOffset:         'earliest', // default
	migrateHLC:               false,    // for details please see Migration section below
	migrateRolling:           true,
	// Callback to allow consumers with autoCommit false a chance to commit before a rebalance finishes
	// isAlreadyMember will be false on the first connection, and true on rebalances triggered after that
	onRebalance:              function ( isAlreadyMember, callback ) {
		console.log ( "onRebalance:", isAlreadyMember );
		callback ();
	}
};
var consumerGroup = new kafka.ConsumerGroup ( consumerGroupOptions, [ "AccountingTopic" ] );
console.log ( 'Netflow consumer service is up' );

consumerGroup.on ( 'message', function ( message ) {
	try {
		console.log ( 'Message received', typeof message.value );
		var netFlowPkg = JSON.parse ( message.value );
		console.log ( 'Message received', netFlowPkg );
	} catch ( error ) {
		console.log ( error );
	}
} );


consumerGroup.on ( 'error', function ( error ) {
	console.log ( 'Error', error );
} );

consumerGroup.on ( 'ready', function () {
	console.log ( 'ready' );
} );
