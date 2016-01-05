node-sofort
====

Module to use sofort.com "sofort gateway" with node.js and iojs.


## Installation

Install with npm

    npm install node-sofort

## Example

	'use strict';
	var util = require('util');
	var Sofort = new (require('./lib/sofort'))({
		configKey: '12345:12345:0082483e03f368a0f89be9b6d381822d'
	});

	Sofort.createPayment(10.00, 'EUR', ['Demo1'], {}, function (err, data) {
	    if (err) return console.log(err);
		console.log(data);
	});

	Sofort.parseNotification('<?xml version="1.0" encoding="UTF-8" ?><status_notification><transaction>27276-146697-55E48EAD-A3EB</transaction><time>2015-08-30T22:30:29+02:00</time></status_notification>',function(err,result){
		if (err) return console.log(err);
		console.log(util.inspect(result, {showHidden: false, depth: null}));
	});


### createPayment(amount,currency,[reason1,reason2], options, callback)


**amount** 

Decimal (8.2) Please note that if the currency_code is "HUF" and a float value has been assigned in API-step 1 the returned amount is rounded to the nearest integer value. (e.g. 1000.50 > 1001 and 1000.49 > 1000).

---

**currency** 

supported (At this time, only EUR, GBP, CHF, PLN, HUF, and CZK are accepted.)

---

**reason1/reason2** 

Reason; please transfer a unique value (e.g. order ID and customer ID, "OID018293 CID00131"), only the following characters are allowed: '0-9', 'a-z', 'A-Z', ' ', '+', ',', '-', '.'. Umlauts are replaced, e.g. ä -> ae. Other characters will be removed for the display on our payment page and for notifications. Therefore, a modified string for reason may be transmitted for redirections (success and abort link and notifications). If the transaction ID of SOFORT Banking should be used as reason, the parameter '-TRANSACTION-' can be inserted in the reason String.

**Important**: Some banks do not display the entire characters of both reasons, e.g. on the account statements the last characters are cut off. Therefore, the important data should be inserted at the beginning of the first reason field.

* Banks of Great Britain (GB) only support 18 digits per reason so we encourage to consider this for integrations that are used in this market.

---

## Options

See https://www.sofort.com/integrationCenter-eng-DE/content/view/full/2513 6.1.2

#### user_variable - String (255)

	{ user_variables: ['variable1','variable2'...'variable20'] }
	
#### email_customer - String (255)

	{ email_customer: 'example@example.com' }
	
#### phone_customer  - String (255)
Phone number of your customer (begins with "+"; possible characters: "0-9 , - / ( )", no letters! )

	{ phone_customer: '+49....' }
	
#### success_url - String (255)
Success link, overwrites the default value from the project settings. Is called when your customer successfully executed SOFORT Banking and the transfer has been listed in the customer's online banking. If the transaction ID of SOFORT Banking should be used as part of the URL, the parameter '-TRANSACTION-' can be inserted in the URL String.

* If no success link is defined in the project settings this parameter becomes mandatory

```{ success_url: 'https://www.example.com/sofort/success' }```
	
#### success_link_redirect  - Boolean
Automatic redirection to success page. If this has not been activated, a summary page of SOFORT GmbH will be displayed to the customer. Overwrites project settings.

	{ success_link_redirect: true }
	
#### abort_url - String (255)
Abort link, overwrites the default value from the project settings. Is called when SOFORT Banking could not be completed successfully (e.g. upon cancellation by the customer or insufficient funds). If the transaction ID of SOFORT Banking should be used as part of the URL, the parameter '-TRANSACTION-' can be inserted in the URL String.

* If no abort link is defined in the project settings this parameter becomes mandatory

```{ abort_url: 'https://www.example.com/sofort/abort' }```
	
#### timeout_url - String (255)
Timeout link, overwrites the default value from the project settings. Is called when the timeout value stored in the project settings has been expired on the payment wizard. If the transaction ID of SOFORT Banking should be used as part of the URL, the parameter '-TRANSACTION-' can be inserted in the URL String.

	{ timeout_url: 'https://www.example.com/sofort/timeout' }
	
#### notification_url - String (255) - max 5 items
Notification link. If the transaction ID of SOFORT Banking should be used as part of the URL, the parameter '-TRANSACTION-' can be inserted in the URL String.

	{ notification_urls: ['https://www.example.com/sofort/notify1', ... , 'https://www.example.com/sofort/notify5'] }
	
	or
	
	{ notification_urls: [{_:'https://www.example.com/sofort/notify1',_notify_on:'pending, loss'}, {_:'https://www.example.com/sofort/notify2',_notify_on:'received'}, ... , 'https://www.example.com/sofort/notify5'] }

Notification link; by replacing the part "xyz" by a special status, only this URL is used for notifications with this status. It is possible to enter several statuses separated by commas, e.g  <notification_url notify_on="pending, loss">. Possible statuses are "received", "loss", "refunded", and "pending" (whereupon "pending" matches the equivalent status "pending - not_credited_yet" and "untraceable - sofort_bank_account_needed". Details can also be found in the corresponding section. (see DOCUMENTATION)

#### notification_email - String (255) - max 5 items
same as before but with email addresses
	
	{ notification_emails: ['example@example.com', ... , 'example@example.net'] }
	
#### customer_protection - Boolean
1 = buyer protection active; should only be used if the additional SOFORT Banking feature "buyer protection" has been agreed between merchant and SOFORT.
	
	{ su: {customer_protection: 1 } }
	

To use some options at ones give a json object like:

	{ 
		user_variables: ['variable1','variable2'...'variable20'],
		success_url: 'https://www.example.com/sofort/success',
		success_link_redirect: true,
		abort_url: 'https://www.example.com/sofort/abort',
		notification_urls: ['https://www.example.com/sofort/notify1', ... , 'https://www.example.com/sofort/notify5'],
		su: {customer_protection: 1 }
	}
	
	
## License

**MIT**
