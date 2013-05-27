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

		var timestamp = req.body.ts;

		// First time to connect to event channel
		if (!timestamp) {
			var eventSet = {
				ts: new Date().getTime(),
				events: []
			};

			res.json(eventSet);
			res.end();
			
			return;
		}

		var onCmds = JSON.parse(req.body.on) || [];

		// Process event listener
		_processCommands(onCmds, { ts: timestamp }, req, res, function(err, events) {
			var eventSet = {
				ts: new Date().getTime(),
				events: events
			};

			res.json(eventSet);
			res.end();
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

	function _waitEvent() {

		// Trying to fetch all events which are fired after last updating time
		runtime.eventMgr.pullEvents(command.event, opts.ts, function(err, events) {

			if (err || events.length == 0) {
				setTimeout(_waitEvent, 500);
				return;
			}

			if (command.callback) {
				// Preparing callback event
				var e = {
					id: command.id,
					type: 'events',
					events: events
				};

				complete(command, e);
				return;
			}

			setTimeout(_waitEvent, 500);
		});
	}

	switch(command.cmd) {
	case 'on':
		// It doesn't have callback function
		if (!command.callback) {
			complete(command, null);
			break;
		}

		_waitEvent();

		break;

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
