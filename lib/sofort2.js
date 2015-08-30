'use strict';

var jxon = require('jxon'),
_ = require('lodash'),
request = require('request');


jxon.config({
  valueKey: '_',                // default: 'keyValue'
  attrKey: '$',                 // default: 'keyAttributes'
  attrPrefix: '$',              // default: '@'
  lowerCaseTags: false,         // default: true
  trueIsEmpty: false,           // default: true
  autoDate: false,              // default: true
  ignorePrefixedNodes: false,   // default: true
  parseValues: false            // default: true
});

function Sofort(options) {
	options = options || {};
	options = _.defaultsDeep(options, { 
		apiUrl: 'https://api.sofort.com/api/xml',
		configKey: undefined,
		clientId: undefined,
		projectId: undefined,
		apiKey: undefined,
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

Sofort.prototype.createPayment = function(amount, currency, reasons, options) {
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
	
	return jxon.jsToXml({multipay:{_:PaymentObj}});

};

Sofort.prototype.postData = function(PaymentXml) {
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

		console.log(jxon.xmlToJs(body));

	});
};

module.exports = Sofort;
