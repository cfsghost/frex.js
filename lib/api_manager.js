"use strict";

var fs = require('fs');
var path = require('path');

var APIManager = module.exports = function(app) {
	var self = this;

	self.app = app;
	self.scripts = [
		'main.js',
		'network.js',
		'remote.js',
		'objects.js',
		'core_engine.js'
	];
	self.cache = null;
};

APIManager.prototype.init = function(callback) {
	var self = this;

	var context = [];

	self.scripts.forEachAsync(function(scriptFile, index, arr, next) {

		fs.readFile(path.join(__dirname, 'client', scriptFile), function(err, data) {
			if (err)
				throw new Error('Cannot load client scripts.');

			context.push(data.toString());

			next();
		});

		return true;
	}, function() {

		self.cache = context.join('');

		// Initializing router for frex.js API
		self.app.get('/frex', function(req, res) {
			res.set('Content-Type', 'application/javascript');
			res.end(self.cache);
		});

		callback();
	});
};
