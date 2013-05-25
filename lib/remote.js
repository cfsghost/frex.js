"use strict";

var Remote = module.exports = function(app) {
	var self = this;

	self.app = app;
};

Remote.prototype.init = function(callback) {
	var self = this;

	// Initializing router for remote control APIs
	self.app.all('/frex/remote', function(req, res) {
		res.end();
	});

	process.nextTick(callback);
};
