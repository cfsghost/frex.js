"use strict";

var express = require('express');
var Application = require('./application');

var Frex = module.exports = function() {
	return new Application();
};

// Clone and override normal members from express
for (var key in express) {

	// Member has Getter/Setter
	var desc = Object.getOwnPropertyDescriptor(express, key);

	if (desc.get || desc.set) {

		// It has getter
		if (desc.get) {
			Frex.__defineGetter__(key, (function(key) {
				return function() {
					return express[key];
				};
			})(key));
		}

		// It has setter
		if (desc.set) {
			Frex.__defineSetter__(key, (function(key) {
				return function(value) {
					express[key] = value;
				};
			})(key));
		}

		continue;
	}

	// Member is a function
	if (express[key] instanceof Function) {

		// Override method with own implementation
		if (key in Application.prototype)
			continue;

		Frex[key] = (function(key) {
			return function() {
				return express[key].apply(express, Array.prototype.slice.call(arguments));
			}
		})(key);

		continue;
	}

	// Normal Member
	Frex.__defineGetter__(key, (function(key) {
		return function() {
			return express[key];
		};
	})(key));

	Frex.__defineSetter__(key, (function(key) {
		return function(value) {
			express[key] = value;
		};
	})(key));
}
