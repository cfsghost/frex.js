"use strict";

var Array = require('node-array');

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
		self.engineDirs(function(dirPath, index. arr) {
			self.load(dirPath);
		}, function() {
			callback();
		});
		self.load();
	}

	// TODO: Compile engines to AST
};

Engine.prototype.load = function(targetDir) {
	var self = this;

	
};

Engine.prototype.addPath = function(engineDir) {
	var self = this;

	self.engineDirs.push(engineDir);
};
