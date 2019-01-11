/**
 * Created by payamyousefi on 11/6/16.
 */

var trilateration = require('trilateration');

trilateration.addBeacon(0, trilateration.vector(2, 4));
trilateration.addBeacon(1, trilateration.vector(5.5, 13));
trilateration.addBeacon(2, trilateration.vector(11.5, 2));

trilateration.setDistance(0, 5.7);
trilateration.setDistance(1, 6.8);
trilateration.setDistance(2, 6.4);

var pos = trilateration.calculatePosition();

console.log('X: ' + pos.x + '; Y: ' + pos.y); // X: 7; Y: 6.5
