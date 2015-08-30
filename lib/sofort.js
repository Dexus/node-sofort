'use strict';

var EasyXml = require('easyxml'),
parseXmlString = require('xml2js').parseString,
_ = require('lodash'),
request = require('request'),
errorcodes = require('./errorcodes');

var util = require('util');

function Sofort(options) {
	options = options || {};
	options = _.defaultsDeep(options, {
			apiUrl : 'https://api.sofort.com/api/xml',
			configKey : undefined,
			clientId : undefined,
			projectId : undefined,
			apiKey : undefined,
		});

	this.apiUrl = options.apiUrl;

	var configKey;
	if (options.configKey) {
		var configKey = options.configKey.split(':');
	}

	this.clientId = configKey[0] || options.clientId;
	this.projectId = configKey[1] || options.projectId;
	this.apiKey = configKey[2] || options.apiKey;
	this.interface_version = 'node-sofort/0.1.0';
}

Sofort.prototype.createPayment = function (amount, currency, reasons, options, cb) {
	var self = this,
	PaymentObj;
	var payObj = {
		project_id : self.projectId,
		interface_version : self.interface_version,
		amount : amount,
		currency_code : currency,
		reasons : reasons,
		su : null
	};
	if (options) {
		var PaymentObj = _.merge(payObj, options);
	} else {
		PaymentObj = payObj;
	}

	var BuildXML = new EasyXml({
			singularizeChildren : true,
			allowAttributes : true,
			rootElement : 'multipay',
			dateFormat : 'ISO',
			indent : 2,
			manifest : true
		});

	self.postData(BuildXML.render(PaymentObj), function (err, body) {
		if (err) {
			cb(err, null);
		}
		try {
			parseXmlString(body, function (err, result) {
				if (err) {
					throw new SofortException('Error postData', ['unknown API error']);
				}

				if (result != null && result.errors) {
					throw new SofortCodeException(result.errors.error[0].code);
				} else if (result != null && result.new_transaction) {
					cb(null, {
						transaction : result.new_transaction.transaction[0],
						payment_url : result.new_transaction.payment_url[0]
					});
				} else {
					throw new SofortException('Error postData', ['unknown API error']);
				}

			});
		} catch (e) {
			if (e.code) {
				throw new SofortCodeException(e.code);
			} else {
				throw new SofortException('Error postData', e.message)
			}
		}
	});

};

Sofort.prototype.postData = function (PaymentXml, cb) {
	var self = this;

	// fire request
	request({
		url : self.apiUrl,
		method : "POST",
		headers : {
			"content-type" : "application/xml; charset=UTF-8",
			"Accept" : "application/xml; charset=UTF-8"
		},
		body : PaymentXml,
		auth : {
			user : self.clientId,
			pass : self.apiKey,
			sendImmediately : true
		}
	}, function (error, response, body) {
		// data responsed
		if (error) {
			console.log('error: 1', error);
			cb(error, null);
		}

		if (!error && response.statusCode == 200) {
			cb(null, body);
		} else if (!error && response.statusCode == 401) {
			throw new SofortException('Error postData', ['401 Unauthorized']);
		} else if (!error && response.statusCode == 404) {
			throw new SofortException('Error postData', ['404 Not Found']);
		} else {
			throw new SofortException('Error postData', ['unknown error']);
		}

	});
};

Sofort.prototype.parseNotification = function (xmlBody, cb) {
	var self = this;

	parseXmlString(xmlBody, function (err, result) {

		if (err) {
			throw new SofortException('Error postData', err);
		}

		console.log(result);

		var BuildXML = new EasyXml({
				singularizeChildren : true,
				allowAttributes : true,
				rootElement : 'transaction_request',
				dateFormat : 'ISO',
				indent : 2,
				manifest : true
			});

		var NotifiObj = {
			_version : 2,
			'transaction' : result.status_notification.transaction[0]
		}

		self.postData(BuildXML.render(NotifiObj), function (err, body) {
			if (err) {
				cb(err, null);
			}
			try {
				parseXmlString(body, function (err, result) {
					if (err) {
						throw new SofortException('Error postData', ['unknown API error']);
					}

					if (result != null && result.errors) {
						throw new SofortCodeException(result.errors.error[0].code);
					} else if (result != null && result.transactions) {
						cb(null, result.transactions.transaction_details[0]);
					} else {
						throw new SofortException('Error postData', ['unknown API error']);
					}

				});
			} catch (e) {
				if (e.code) {
					throw new SofortCodeException(e.code);
				} else {
					throw new SofortException('Error postData', e.message)
				}
			}
		});

	});

};

function SofortException(msg, err) {
	this.message = msg + ' -> ' + err;

	this.name = "SofortException";
};
SofortException.prototype = Error.prototype;

function SofortCodeException(code) {
	this.message = code + ' ' + errorcodes[code];
	this.code = code;
	this.name = "SofortCodeException";
};
SofortCodeException.prototype = Error.prototype;

module.exports = Sofort;
