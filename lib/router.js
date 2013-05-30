"use strict";

var util = require('util');
var Courser = require('courser');

var Router = module.exports = function(app) {
	var self = this;

	self.app = app;
	self.courser = new Courser(app);
};

Router.prototype.init = function(callback) {
	var self = this;

	try {
		self.courser.init(callback);
	} catch(e) {
		process.nextTick(callback);
	}
};

Router.prototype.addPath = function(routeDir) {
	var self = this;

	self.courser.addPath(routeDir);
};
