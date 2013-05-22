"use strict";

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
};

