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
			runtime.check_permission({ req: req, res: res }, function(permission) {

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
		runtime.check_permission({ req: req, res: res }, function(permission) {

			// Permission denied
			if (!permission) {
				res.status(403);
				res.end();
				return;
			}

			res.end(runtime.cache);
		});
	});

	// Load all engines
	self.engineDirs.forEachAsync(function(dirPath, index, arr) {

		self.load(dirPath);
	}, function() {
		callback();
	});
};

Engine.prototype.load = function(dirPath) {
	var self = this;

	fs.readdir(dirPath, function(err, files) {
		if (err)
			return;

		files.forEachAsync(function(filename, index, arr) {

			var fullpath = path.join(dirPath, filename);

			try {
				// Check whether it is a directory
				var stats = fs.lstatSync(fullpath);
				if (stats.isDirectory()) {

					// Scanning sub-directory
					self.load(fullpath);
					return;
				}
			} catch(e) {}

			self.loadEngine(fullpath);
		});
	});
};

Engine.prototype.loadEngine = function(filename) {
	var self = this;

    // Check file, only for javascript files (.js).
    if (!/.*\.js$/g.test(filename))
        return;

	// Loading engine and checking header
	var engine = require(filename);
	if (!engine.type)
		return;

	if (engine.type != 'engine')
		return;

	// Create instance
	engine.instance = new engine.prototype(self.app.frex);

	// Compile instance to bytecode
	self.genBytecode(engine.engine_name, engine.instance, function(err, bytecode) {

		self.runtimes[engine.engine_name] = {
			engine: engine,
			bytecode: bytecode,
			cache: (bytecode) ? JSON.stringify(bytecode) : null,
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
		};
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
