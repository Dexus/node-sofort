'use strict';

var EasyXml = require('easyxml'),
parseXmlString = require('xml2js').parseString,
_ = require('lodash'),
request = require('request'),
async = require('async'),
errorcodes = require('./errorcodes');


function Sofort(options) {
	options = options || {};
	options = _.defaultsDeep(options, {
			apiUrl : 'https://api.sofort.com/api/xml',
			configKey : undefined,
			clientId : undefined,
			projectId : undefined,
			apiKey : undefined
		});

	this.apiUrl = options.apiUrl;

	var configKey;
	if (options.configKey) {
		configKey = options.configKey.split(':');
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
		PaymentObj = _.merge(payObj, options);
	} else {
		PaymentObj = payObj;
	}

	async.waterfall([
			function (callback) {
				var BuildXML = new EasyXml({
						singularizeChildren : true,
						allowAttributes : true,
						rootElement : 'multipay',
						dateFormat : 'ISO',
						indent : 2,
						manifest : true
					});
				self.postData(BuildXML.render(PaymentObj), function (err, body) {
					return callback(err, body);
				});
			},
			function (body, callback) {
				try {
					parseXmlString(body, function (err, result) {
						if (err) {
							throw new SofortException('Error postData', ['unknown API error']);
						}

						if (result !== null && result.errors) {
							throw new SofortCodeException(result.errors.error[0].code);
						} else if (result !== null && result.new_transaction) {
							return callback(null, {
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
						throw new SofortException('Error postData', e.message);
					}
				}
			},
		], function (err, result) {
			// result now equals 'done'
			return cb(err, result);
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
			return cb(error, null);
		}

		if (!error && response.statusCode === 200) {
			cb(null, body);
		} else if (!error && response.statusCode === 401) {
			throw new SofortException('Error postData', ['401 Unauthorized']);
		} else if (!error && response.statusCode === 404) {
			throw new SofortException('Error postData', ['404 Not Found']);
		} else {
			throw new SofortException('Error postData', ['unknown error']);
		}

	});
};

Sofort.prototype.parseNotification = function (xmlBody, cb) {
	var self = this;

	async.waterfall([
			function (callback) {
				parseXmlString(xmlBody, function (err, result) {
					return callback(err, result);
				});
			},
			function (result, callback) {
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
				};

				self.postData(BuildXML.render(NotifiObj), function (err, body) {
					return callback(err, body);
				});
			},
			function (body, callback) {
				try {
					parseXmlString(body, function (err, result) {
						if (err) {
							throw new SofortException('Error postData', ['unknown API error']);
						}

						if (result !== null && result.errors) {
							throw new SofortCodeException(result.errors.error[0].code);
						} else if (result !== null && result.transactions) {
							return callback(err, result.transactions.transaction_details[0]);
						} else {
							throw new SofortException('Error postData', ['unknown API error']);
						}

					});
				} catch (e) {
					if (e.code) {
						throw new SofortCodeException(e.code);
					} else {
						throw new SofortException('Error postData', e.message);
					}
				}

			},
			function (json, callback) {
				var Obj = {
					project_id : json.project_id[0],
					transaction : json.transaction[0],
					test : json.test[0],
					time : json.time[0],
					status : json.status[0],
					status_reason : json.status_reason[0],
					status_modified : json.status_modified[0],
					payment_method : json.payment_method[0],
					language_code : json.language_code[0],
					amount : json.amount[0],
					amount_refunded : json.amount_refunded[0],
					currency_code : json.currency_code[0],
					reasons : {
						reason : json.reasons[0].reason,
					},
					user_variables : json.user_variables[0],
					sender : {
						holder : json.sender[0].holder[0],
						account_number : json.sender[0].account_number[0],
						bank_code : json.sender[0].bank_code[0],
						bank_name : json.sender[0].bank_name[0],
						bic : json.sender[0].bic[0],
						iban : json.sender[0].iban[0],
						country_code : json.sender[0].country_code[0]
					},
					recipient : {
						holder : json.recipient[0].holder[0],
						account_number : json.recipient[0].account_number[0],
						bank_code : json.recipient[0].bank_code[0],
						bank_name : json.recipient[0].bank_name[0],
						bic : json.recipient[0].bic[0],
						iban : json.recipient[0].iban[0],
						country_code : json.recipient[0].country_code[0]
					},
					email_customer : json.email_customer[0],
					phone_customer : json.phone_customer[0],
					exchange_rate : json.exchange_rate[0],
					costs : {
						fees : json.costs[0].fees[0],
						currency_code : json.costs[0].currency_code[0],
						exchange_rate : json.costs[0].exchange_rate[0]
					},
					su : {
						consumer_protection : json.su[0].consumer_protection[0]
					},
					status_history_items : {
						status_history_item : json.status_history_items[0].status_history_item
					}
				};
				return callback(null, Obj);
			}
		], function (err, result) {
			// result now equals 'done'
			return cb(err, result);
		});
};

function SofortException(msg, err) {
	this.message = msg + ' -> ' + err;
	this.name = "SofortException";
}
SofortException.prototype = Error.prototype;

function SofortCodeException(code) {
	this.message = code + ' ' + errorcodes[code];
	this.code = code;
	this.name = "SofortCodeException";
}
SofortCodeException.prototype = Error.prototype;

module.exports = Sofort;
