"use strict";

var path = require('path');

var Router = require('./router');
var Engine = require('./engine');

// Inherit express
var express = require('express');

var Application = module.exports = function() {
	var self = this;

	// Create a new express application
	self.super = express();

	// Clone and override normal members
	for (var key in self.super) {

		// Member has Getter/Setter
		var desc = Object.getOwnPropertyDescriptor(self.super, key);

		if (desc.get || desc.set) {

			// It has getter
			if (desc.get) {
				self.__defineGetter__(key, (function(key) {
					return function() {
						return self.super[key];
					};
				})(key));
			}

			// It has setter
			if (desc.set) {
				self.__defineSetter__(key, (function(key) {
					return function(value) {
						self.super[key] = value;
					};
				})(key));
			}

			continue;
		}

		// Member is a function
		if (self.super[key] instanceof Function) {

			// Override method with own implementation
			if (key in Application.prototype)
				continue;

			self[key] = (function(key) {
				return function() {
					return self.super[key].apply(self.super, Array.prototype.slice.call(arguments));
				}
			})(key);

			continue;
		}

		// Normal Member
		self.__defineGetter__(key, (function(key) {
			return function() {
				return self.super[key];
			};
		})(key));

		self.__defineSetter__(key, (function(key) {
			return function(value) {
				self.super[key] = value;
			};
		})(key));
	}

	// Initializing Router
	self.frexRouter = new Router(self);

	// Initializing Engines
	self.frexEngine = new Engine(self);
};

Application.prototype.configure = function(callback) {
	var self = this;

	var args = Array.prototype.slice.call(arguments);

	// Super
	self.super['configure'].apply(self.super, args);

	return self;
};

Application.prototype.listen = function() {
	var self = this;

	var args = Array.prototype.slice.call(arguments);
	var mainPath = path.dirname(require.main.filename);

	// Initializing Engine
	self.frexEngine.addPath(path.join(mainPath, 'engine'));

	// Initializing routing
	self.frexRouter.addPath(path.join(mainPath, 'routes'));
	self.frexRouter.init(function() {
		// Super
		self.super['listen'].apply(self.super, args);
	});

	return self;
};
