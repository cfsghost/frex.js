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

	// Initializing router for Engine
	self.app.all('/frex/engine/:engine_name', function(req, res) {
		var engine = self.getEngine(req.params.engine_name);

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

			// Load file and check header
			var engine = require(fullpath)
			if (!engine.type)
				return;

			if (engine.type != 'engine')
				return;

			// Compile instance to bytecode
			self.genBytecode(engine.engine_name, engine.instance, function(err, bytecode) {

				self.runtimes[engine.engine_name] = {
					engine: engine,
					bytecode: bytecode,
					cache: JSON.stringify(bytecode)
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
			var hasSubItem = false;
			for (var key in inst) {
				hasSubItem = true;

				_genBytecode(inst[key], inline.path.concat([ key ]));
			}

			// It's instance object
			if (hasSubItem && inline.type == 'o')
				inline.type = 'c';
		}
	}

	_genBytecode(instance, [ engineName ]);

	process.nextTick(function() {
		callback(null, bytecode);
	});
};

Engine.prototype.genRunner = function(engineName, bytecode, callback) {
	var self = this;

	var source = [];
	var runner = [];

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

		source.push(exec);

//		eval(exec);

	}, function() {
		callback(null, source.join('\n'));
	});
};

Engine.prototype.addPath = function(engineDir) {
	var self = this;

	self.engineDirs.push(engineDir);
};

Engine.prototype.getEngine = function(engineName) {
	var self = this;

	if (!self.runtimes[engineName])
		return null;

	return self.runtimes[engineName];
};
