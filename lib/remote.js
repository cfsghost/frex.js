"use strict";

var Array = require('node-array');

var Remote = module.exports = function(app) {
	var self = this;

	self.app = app;
};

Remote.prototype.init = function(callback) {
	var self = this;

	// Initializing router for remote control APIs
	self.app.all('/frex/remote', function(req, res) {

		var events = [];

		var cmds = JSON.parse(req.body.cmds);
		cmds.forEachAsync(function(command, index, arr, next) {
			self.execute(command, function(command, args) {
				var e = {
					id: command.id,
					type: 'callback',
					args: args
				};

				events.push(e);

				next();
			});

			return true;
		}, function() {
			res.json(events);
			res.end();
		});
	});

	process.nextTick(callback);
};

Remote.prototype.execute = function(command, complete) {
	var self = this;

	var objPath = command.objPath.split('.');
	var engineName = objPath[0];
	var runtime = self.app.frexEngine.getRuntime(engineName);

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
					complete(command, Array.prototype.slice.call(arguments));
				});
			}
			obj.apply(_parent, args);
		});
		break;
	}
};
