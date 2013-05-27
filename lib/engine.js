"use strict";

var Array = require('node-array');
var fs = require('fs');
var path = require('path');
var util = require('util');
var events = require('events');
var EventManager = require('./event_manager');

var Engine = module.exports = function(app) {
	var self = this;

	self.app = app;
	self.engineDirs = []
	self.runtimes = {};
};

Engine.prototype.init = function(callback) {
	var self = this;

	// Initializing router for Engine
	self.app.all('/frex/engine/:engine_name', function(req, res) {
		var engine = self.getRuntime(req.params.engine_name);

		res.end(engine.cache);
	});

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

			// Loading engine and checking header
			var engine = require(fullpath)
			if (!engine.type)
				return;

			if (engine.type != 'engine')
				return;

			// Create instance
			engine.instance = new engine.prototype();

			// Compile instance to bytecode
			self.genBytecode(engine.engine_name, engine.instance, function(err, bytecode) {

				self.runtimes[engine.engine_name] = {
					engine: engine,
					bytecode: bytecode,
					cache: JSON.stringify(bytecode),
					eventMgr: new EventManager(engine)
				};
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
			type: null,
			f: null
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
			var hasSubItem = false;
			for (var key in inst) {
				hasSubItem = true;

				_genBytecode(inst[key], inline.path.concat([ key ]));
			}

			// It's instance object
			if (hasSubItem && inline.type == 'o') {
				inline.type = 'c';
			}
		} else {
			inline.type = 'v';
			inline.val = inst;
		}
	}

	_genBytecode(instance, [ engineName ]);

	process.nextTick(function() {
		callback(null, bytecode);
	});
};

Engine.prototype.addPath = function(engineDir) {
	var self = this;

	self.engineDirs.push(engineDir);
};

Engine.prototype.getRuntime = function(engineName) {
	var self = this;

	if (!self.runtimes[engineName])
		return null;

	return self.runtimes[engineName];
};
