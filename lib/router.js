"use strict";

var Courser = require('courser');

var Router = module.exports = function(app) {
	var self = this;

	self.app = app;
	self.courser = new Courser(app);
};

Router.prototype.init = function(callback) {
	var self = this;

	self.courser.init(callback);
};

Router.prototype.addPath = function(routeDir) {
	var self = this;

	self.courser.addPath(routeDir);
};
