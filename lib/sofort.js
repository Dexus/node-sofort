'use strict';

var EasyXml = require('easyxml'),
parseXmlString = require('xml2js').parseString,
_ = require('lodash'),
request = require('request');

var BuildXML = new EasyXml({
		singularizeChildren : true,
		allowAttributes : true,
		elementPrefix : '@',
		rootElement : 'multipay',
		dateFormat : 'ISO',
		indent : 2,
		manifest : true
	});

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

Sofort.prototype.createPayment = function (amount, currency, reasons, options) {
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

	return BuildXML.render(PaymentObj);

};

Sofort.prototype.postData = function (PaymentXml) {
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
	}, function optionalCallback(err, httpResponse, body) {
		// data responsed

		parseXmlString(body, function (err, result) {
			console.dir(result);
		});

	});
};

module.exports = Sofort;
