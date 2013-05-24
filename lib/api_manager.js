"use strict";

var fs = require('fs');
var path = require('path');

var APIManager = module.exports = function(app) {
	var self = this;

	self.app = app;
	self.cache = null;
};

APIManager.prototype.init = function(callback) {
	var self = this;

	// Initializing router for frex.js API
	fs.readFile(path.join(__dirname, 'client', 'main.js'), function(err, data) {
		if (err)
			throw new Error('Cannot load client scripts.');

		self.cache = data.toString();

		self.app.get('/frex', function(req, res) {
			res.set('Content-Type', 'application/javascript');
			res.end(self.cache);
		});

		callback();
	});
};
