"use strict";

var util = require('util');
var events = require('events');

var MyCSRF = function() {
	var self = this;

	self.message = 'Hello, CSRF middleware.';
};

util.inherits(MyCSRF, events.EventEmitter);

MyCSRF.prototype.addMessage = function(message, callback) {
    var self = this;

    console.log(message);

    self.emit('message', {
        "message": "Hello, CSRF from EventEmitter."
    });
    console.log('Event fired');

    if (callback) callback(null);
};

MyCSRF.prototype.hello = function(params, callback) {
    var self = this;

    // Just callback
    callback(null, params);
};

module.exports = {
	type: 'engine',
	engine_name: 'MyCSRF',
	prototype: MyCSRF
};
