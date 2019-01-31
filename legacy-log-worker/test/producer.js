/*
var kafka = require ( 'kafka-node' ),
	client = new kafka.KafkaClient ( { kafkaHost: '94.130.186.129:9092' } ),
	producer = new kafka.Producer ( client ),
	payloads = [
		{ topic: 'netflow', messages: 'hi', partition: 0 },
	];
producer.on ( 'ready', function () {
	client.refreshMetadata (['netflow'],function () {

	});
	producer.send ( payloads, function ( err, data ) {
		console.log ( data );
	} );
} );

producer.on ( 'error', function ( err ) {
	console.log ( err );
} );
*/
