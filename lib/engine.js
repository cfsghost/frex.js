"use strict";

var Array = require('node-array');
var fs = require('fs');
var path = require('path');
var util = require('util');

var Engine = module.exports = function(app) {
	var self = this;

	self.app = app;
	self.engineDirs = []
	self.runtimes = {};
};

Engine.prototype.init = function(callback) {
	var self = this;

	// Load all engines
	if (self.engineDirs.length) {
		self.engineDirs.forEachAsync(function(dirPath, index, arr) {

			self.load(dirPath);
		}, function() {
			callback();
		});
	}
};

Engine.prototype.load = function(dirPath) {
	var self = this;

	fs.readdir(dirPath, function(err, files) {
		files.forEachAsync(function(filename, index, arr) {

			var fullpath = path.join(dirPath, filename);

			// Load file and check header
			var engine = require(fullpath)
			if (!engine.type)
				return;

			if (engine.type != 'engine')
				return;

			// Compile instance to runner
			self.genBytecode(engine.engine_name, engine.instance, function(err, bytecode) {

				self.genRunner(engine.engine_name, bytecode, function(err, runner) {

					self.runtimes[engine.engineName] = {
						engine: engine,
						runner: runner
					};
				});
			});
		});
	});
};

Engine.prototype.genBytecode = function(engineName, instance, callback) {
	var self = this;

	var bytecode = [];

	function _genBytecode(inst, entryPath) {

		var inline = {
			path: entryPath,
			type: null
		};

		bytecode.push(inline);

		if (inst instanceof Function) {
			inline.type = 'f';

		} else if (inst instanceof Object) {

			if (inst instanceof Array) {
				inline.type = 'a';
			} else {
				inline.type = 'o';
			}

			// Process sub-items
			for (var key in inst) {

				_genBytecode(inst[key], inline.path.concat([ key ]));
			}

		}
	}

	_genBytecode(instance, [ engineName ]);

	process.nextTick(function() {
		callback(null, bytecode);
	});
};

Engine.prototype.genRunner = function(engineName, bytecode, callback) {
	var self = this;

	var runner = {};

	// Creating a runner object from bytecode
	bytecode.forEachAsync(function(inline, index, arr) {
		var objPath = [ 'runner' ].concat(inline.path).join('.');
		var exec = null;

		console.log(objPath);

		switch(inline.type) {
		case 'o':
			exec = util.format('%s = {};', objPath);
			break;

		case 'f':
			exec = util.format('%s = %s;', objPath, function() {
				// TODO: wrapper to call remote methods
				Barbarian.callFunc(engineName, arguments);
			});

			break;
		}

		eval(exec);

	}, function() {
		callback(null, runner);
	});
};

Engine.prototype.addPath = function(engineDir) {
	var self = this;

	self.engineDirs.push(engineDir);
};

Engine.prototype.getRunner = function(engineName) {
	var self = this;

	return self.runtimes[engineName] || null;
};
