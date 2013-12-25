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
	self.engineDirs = [];
	self.runtimes = {};
};

Engine.prototype.init = function(callback) {
	var self = this;

	// Load all engines
	self.engineDirs.forEachAsync(function(dirPath, index, arr, next) {

		self.load(dirPath, next);

		return true;
	}, function() {
		callback();
	});
};

Engine.prototype.initRoutes = function(callback) {
	var self = this;

	// Initializing router for Engine
	self.app.post('/frex/engine', function(req, res) {

		// API for Loading multiple engines at the same time

		if (!req.body.engines) {
			res.status(404);
			res.end();
			return;
		}

		var engines = JSON.parse(req.body.engines);
		var bytecodes = {};
		engines.forEachAsync(function(engineName, index, arr, next) {

			// No such engine
			var runtime = self.getRuntime(engineName);
			if (!runtime)
				return;

			// Check permission with internal machenism of engine
			runtime.check_permission(req.conn, function(permission) {

				// Permission denied
				if (!permission) {
					next();
					return;
				}

				bytecodes[engineName] = runtime.cache;

				next();
			});

			return true;
			
		}, function() {
			res.json(bytecodes);
			res.end();
		});
		
	});

	self.app.get('/frex/engine/:engine_name', function(req, res) {
		var runtime = self.getRuntime(req.params.engine_name);
		if (!runtime) {
			res.status(404);
			res.end();
			return;
		}

		// Check permission with internal machenism of engine
		runtime.check_permission(req.conn, function(permission) {

			// Permission denied
			if (!permission) {
				res.status(403);
				res.end();
				return;
			}

			res.end(runtime.cache);
		});
	});

	process.nextTick(callback);
};

Engine.prototype.load = function(dirPath, callback) {
	var self = this;

	fs.readdir(dirPath, function(err, files) {
		if (err)
			return;

		files.forEachAsync(function(filename, index, arr, next) {

			var fullpath = path.join(dirPath, filename);

			self.loadEngine(fullpath, function(err, runtime) {

				if (err) {
					console.log(err);
					return;
				}

				self.runtimes[runtime.engine.engine_name] = runtime;

				next();
			});

			return true;

		}, function() {
			callback();
		});
	});
};

Engine.prototype.loadEngine = function(filename, callback) {
	var self = this;

	fs.stat(filename, function(err, stats) {

		if (!stats.isDirectory()) {

			// Check file, only for javascript files (.js).
			if (!/.*\.js$/g.test(filename)) {
				callback(new Error(filename + ' is not engine'));
				return;
			}
		}

		// Loading engine
		var engine = require(filename);

		try {
			// Checking header
			if (!engine.type)
				throw new Error();

			if (engine.type != 'engine')
				throw new Error();

		} catch(e) {

			callback(new Error(filename + ' is not engine'));
			return;
		}

		// Create instance
		engine.instance = new engine.prototype();
		engine.app = self.app;
		engine.frex = self.app.frex;
		engine.prototype.app = self.app;
		engine.prototype.frex = self.app.frex;
		engine.prototype.engine = engine;

		// Create a runtime object
		var runtime = {
			engine: engine,
			bytecode: null,
			cache: null,
			eventMgr: new EventManager(engine),
			check_permission: function(data, callback) {

				process.nextTick(function() {

					if (engine.check_permission) {
						engine.check_permission(data, callback);
					} else {
						// Always allow
						callback(true);
					}
				});
			}
		}

		process.nextTick(function() {
			callback(null, runtime);
		});
	});
};

Engine.prototype.configureAllEngines = function(callback) {
	var self = this;

	// Configuring all engines
	Object.keys(self.runtimes).forEachAsync(function(engineName, index, runtimes, next) {

		self.configureEngine(self.runtimes[engineName], function(err) {
			next();
		});

		return true;

	}, function() {
		callback();
	});
};

Engine.prototype.configureEngine = function(runtime, callback) {
	var self = this;

	var engine = runtime.engine || null;
	if (!engine) {
		process.nextTick(function() {
			callback(new Error('Runtime is invalid.'));
		});
		return;
	}

	if (!engine.hasOwnProperty('constructor')) {

		// Activate engine to create instance
		self.activateEngine(runtime, callback);
		return;
	}

	// Initializing engine with constructor
	engine.constructor(engine, function(err) {

		// Activate engine to create instance
		self.activateEngine(runtime, callback);
	});
};

Engine.prototype.activateEngine = function(runtime, callback) {
	var self = this;

	var engine = runtime.engine || null;
	if (!engine) {
		process.nextTick(function() {
			callback(new Error('Runtime is invalid.'));
		});
		return;
	}

	// Compile instance to bytecode
	self.genBytecode(engine.engine_name, engine.instance, function(err, bytecode) {

		runtime.bytecode = bytecode;
		runtime.cache = (bytecode) ? JSON.stringify(bytecode) : null;

		callback(null);
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
