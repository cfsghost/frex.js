"use strict";

var Array = require('node-array');
var util = require('util');
var events = require('events');

var EventManager = module.exports = function(engine) {
	var self = this;

	self.engine = engine;
	self.events = {};
	self.lifttime = 60000;

	self.gcID = setTimeout(function() {
		self.gc();
	}, self.lifttime);
};

util.inherits(EventManager, events.EventEmitter);

EventManager.prototype.gc = function() {
	var self = this;

	self.removeTimeoutEvents(new Date().getTime() - self.lifetime, function() {

		self.gcID = setTimeout(self.gc, self.lifttime);
	});
};

EventManager.prototype.setLifttime = function(interval) {
	var self = this;

	clearTimeout(self.gcID);

	self.lifttime = interval || 60000;

	self.gcID = setTimeout(function() {
		self.gc();
	}, self.lifttime);
};

EventManager.prototype.pullEvents = function(eventName, timestamp, callback) {
	var self = this;

	var events = [];

	// this engine doesn't has event emitter, we don't need to handle it
	if (!self.engine.instance.on) {
		callback(null, events);
		return;
	}

	// Does't have any listeners yet for this event
	if (!self.events[eventName]) {

		// Initializing queue for this event
		self.events[eventName] = [];

		// Make listener to hook event
		self.engine.instance.on(eventName, function() {

			// Create a new event when received from engine
			var e = {
				args: Array.prototype.slice.call(arguments),
				ts: new Date().getTime()
			}

			// Add to event list
			self.AddEvent(eventName, e, function() {

				// make notification that event manager received a new event
				self.emit('updated', e);
			});
		});
	}

	// Fetch all events from queue by timestamp
	self.events[eventName].forEachAsync(function(e, index, arr) {

		if (e.ts > timestamp)
			events.push(e);

	}, function() {
		callback(null, events);
	});
};

EventManager.prototype.removeTimeoutEvents = function(timestamp, callback) {
	var self = this;

	var eventNames = Object.keys(self.events);
	eventNames.forEachAsync(function(eventName, index, att, next) {

		// Pull events what we want, and replacing old event list
		self.pullEvents(eventName, timestamp, function(err, events) {

			// Delete this event set if there is no events
			if (events.length == 0) {
				delete self.events[eventName];
			} else {
				self.events[eventName] = events;
			}

			next();
		})

		return true;
	}, function() {

		callback(null);
	});
};

EventManager.prototype.AddEvent = function(eventName, e, callback) {
	var self = this;

	// Create a new queue set if it doesn't exist
	if (!self.events[eventName])
		self.events[eventName] = [];

	// add event to queue
	self.events[eventName].push(e);

	process.nextTick(function() {

		callback(null);
	});
};
