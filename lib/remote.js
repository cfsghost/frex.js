"use strict";

var Array = require('node-array');
var util = require('util');
var events = require('events');

var Remote = module.exports = function(app) {
	var self = this;

	self.app = app;
};

util.inherits(Remote, events.EventEmitter);

Remote.prototype.init = function(callback) {
	var self = this;

	function _processCommands(cmds, opts, req, res, callback) {
		var events = [];

		cmds.forEachAsync(function(command, index, arr, next) {

			self.execute(command, opts, function(command, e) {

				// There is event or callback needs to be sent back
				if (e) {
					events.push(e);
				}

				next();
			});

			return true;
		}, function() {
			callback(null, events);
		});
	};

	// Initializing router for remote control APIs
	self.app.all('/frex/remote', function(req, res) {

		var cmds = JSON.parse(req.body.cmds) || [];

		// Process commands
		_processCommands(cmds, {}, req, res, function(err, events) {

			res.json(events);
			res.end();
		});
	});

	self.app.all('/frex/remote/event', function(req, res) {

		// Get last updated time
		var timestamp = req.body.ts || null;
		if (!timestamp || timestamp == 'null')
			timestamp = new Date().getTime();

		var onCmds = JSON.parse(req.body.on) || [];

		var events = [];
		var hasListener = false;
		var listeners = [];
		var ready = false;

		function _setListener(callback) {

			if (hasListener) {
				callback();
				return;
			}

			hasListener = true;

			onCmds.forEachAsync(function(command, index, arr) {

				var objPath = command.objPath.split('.');
				var engineName = objPath[0];
				var runtime = self.app.frexEngine.getRuntime(engineName);

				if (!runtime) {
					return;
				}

				if (!command.callback) {
					return;
				}

				var updated = false;
				var e = {
					id: command.id,
					type: 'events',
					events: []
				}

				function _handler(event) {
					e.events.push(event);

					if (updated)
						return;

					// Ready to send
					events.push(e);

					if (!ready) {
						setTimeout(function() {
							_readyToSend();
						}, 10);

						ready = true;
					}
				}

				runtime.eventMgr.on('updated', _handler);

				listeners.push({
					runtime: runtime,
					handler: _handler
				});

			}, function() {

				callback();
			});
		}

		function _removeListener() {

			listeners.forEach(function(listener, index, arr) {
				listener.runtime.eventMgr.removeListener('updated', listener.handler);
			});

			listeners = [];
		}

		function _fetchEvents(callback) {

			onCmds.forEachAsync(function(command, index, arr, next) {

				var objPath = command.objPath.split('.');
				var engineName = objPath[0];
				var runtime = self.app.frexEngine.getRuntime(engineName);

				if (!runtime) {
					return;
				}

				if (!command.callback) {
					return;
				}

				// Trying to fetch all events which are fired after last updating time
				runtime.eventMgr.pullEvents(command.event, timestamp, function(err, es) {

					if (err || es.length == 0) {
						next();
						return;
					}

					// Preparing callback event
					var e = {
						id: command.id,
						type: 'events',
						events: es
					};

					events.push(e);

					next();
				});

				return true;

			}, function() {

				callback();
			});
		}

		function _readyToSend() {

			if (events.length == 0) {
				return;
			}

			// Clear listener
			_removeListener();

			// Send to client
			var eventSet = {
				ts: new Date().getTime(),
				events: events
			};

			res.json(eventSet);
			res.end();

			return;

		}

		_fetchEvents(function() {

			// There is no event, continue to wait
			if (events.length == 0) {

				// Set listener to receive events and check it per 0.5 secs
				_setListener(function() {

					// Timeout
					setTimeout(function() {

						_removeListener();

						var eventSet = {
							ts: new Date().getTime(),
							events: events
						};

						res.json(eventSet);
						res.end();

					}, 60000);
				});

				return;
			}

			_readyToSend();
		});

	});

	process.nextTick(callback);
};

Remote.prototype.execute = function(command, opts, complete) {
	var self = this;

	var objPath = command.objPath.split('.');
	var engineName = objPath[0];
	var runtime = self.app.frexEngine.getRuntime(engineName);

	if (!runtime) {
		complete(command, null);
		return;
	}

	function _getObject(inst, index, callback) {

		var newInst = inst[objPath[index]] || null;

		if (!newInst) {
			callback(new Error('No such object \'' + objPath[index] + '\''));
			return;
		}

		// Found already
		if (objPath.length == index + 1) {
			callback(null, inst, newInst);
			return;
		}

		getObject(newInst, index + 1, callback);
	}

	switch(command.cmd) {
	case 'call':

		// Found target function object then execute it
		_getObject(runtime.engine.instance, 1, function(err, _parent, obj) {
			var args = command.args;

			if (command.callback) {
				args = args.concat(function() {

					// Preparing callback event
					var e = {
						id: command.id,
						type: 'callback',
						args: Array.prototype.slice.call(arguments)
					};

					complete(command, e);
				});
			} else {
				complete(command, null);
			}

			// Execute this function
			obj.apply(_parent, args);
		});
		break;

	case 'set':
		if (!command.args) {
			complete(command, null);
			return;
		}

		// Found object than trying to set value
		_getObject(runtime.engine.instance, 1, function(err, _parent, obj) {
			var propName = objPath[objPath.length - 1];

			_parent[propName] = command.args;

			// Completed
			if (command.callback) {

				// Preparing callback event
				var e = {
					id: command.id,
					type: 'callback',
					args: []
				};

				complete(command, e);

				return;
			}

			complete(command, null);
		});

	}
};
