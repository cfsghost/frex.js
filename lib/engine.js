"use strict";

var Array = require('node-array');
var fs = require('fs');
var path = require('path');

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

	// TODO: Compile engines to AST
};

Engine.prototype.load = function(dirPath) {
	var self = this;

	fs.readdir(dirPath, function(err, files) {
		files.forEachAsync(function(filename, index, arr) {
			var fullpath = path.join(dirPath, filename);

//			var engine = 

			self.runtimes[fullpath] = require(fullpath);
		});
	});
};

Engine.prototype.addPath = function(engineDir) {
	var self = this;

	self.engineDirs.push(engineDir);
};
