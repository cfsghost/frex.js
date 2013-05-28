"use strict";

var util = require('util');
var events = require('events');

// Private
var messages = [];

var Chat = function() {
	var self = this;

	self.topic = 'What do you think about frex.js?';
};

util.inherits(Chat, events.EventEmitter);

Chat.prototype.addMessage = function(user, msg, callback) {
	var self = this;

	var message = {
		user: user,
		msg: msg,
		ts: new Date().getTime()
	};

	messages.push(message);

	self.emit('message', message);

	if (callback)
		callback(null);
};

module.exports = {
	type: 'engine',
	engine_name: 'Chat',
	prototype: Chat
};
