node-sofort
===

Module to use sofort.com "sofort gateway" with node.js and iojs.


## Installation

Install with npm

    npm install node-sofort

## Example

	'use strict';
	var util = require('util');
	var Sofort = new (require('./lib/sofort'))({
			configKey : '12345:12345:0082483e03f368a0f89be9b6d381822d'
		});

	try {
		Sofort.createPayment(10.00, 'EUR', ['Demo1'], {}, function (err, data) {
			console.log(data);
		});
	} catch (e) {
		console.log(e);
	}


	try {
		Sofort.parseNotification('<?xml version="1.0" encoding="UTF-8" ?><status_notification><transaction>27276-146697-55E48EAD-A3EB</transaction><time>2015-08-30T22:30:29+02:00</time></status_notification>',function(err,result){
			console.log(util.inspect(result, {showHidden: false, depth: null}));
		});
	} catch (e) {
		console.log(e);
	}


## License

**MIT**
