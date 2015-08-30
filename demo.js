'use strict';

var sofortGW = require('./lib/sofort');
var Sofort = new sofortGW({
	configKey:'27276:140084:91a1f1e0c470586083804b33c6dead97'
});


var payData = Sofort.createPayment(10.00,'EUR',['Demo1']);

Sofort.postData(payData);

