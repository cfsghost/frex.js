"use strict";

var Array = require('node-array');
var path = require('path');

var Router = require('./router');
var Engine = require('./engine');
var APIManager = require('./api_manager');
var Remote = require('./remote');

// Inherit express
var express = require('express');

var Application = module.exports = function() {
	var self = this;

	var initialized = false;
	// Create a new express application
	var expressSuper = express();
	var app = function() {
		var args = Array.prototype.slice.call(arguments);
		if (!initialized) {
			initialized = true;
			initialize(function() {
				expressSuper.apply(this, args);
			});

			return;
		}

		expressSuper.apply(this, args);
	};

	app.super = expressSuper;

	function initialize(callback) {
		var mainPath = path.dirname(require.main.filename);

		var tasks = [
			function(complete) {
				// Initializing Engine
				app.frexEngine.addPath(path.join(mainPath, 'engine'));
				app.frexEngine.init(function() {
					complete();
				});
			},
			function(complete) {
				// Initializing API manager
				app.frexAPIManager.init(function() {
					complete();
				});
			},
			function(complete) {
				// Initializing Remote handler
				app.frexRemote.init(function() {
					complete();
				});
			},
			function(complete) {
				// Initializing routing
				app.frexRouter.addPath(path.join(mainPath, 'routes'));
				app.frexRouter.init(function() {
					complete();
				});
			}
		];

		// Do some work before listen to port
		tasks.forEachAsync(function(task, index, arr, next) {
			task(next);

			return true;
		}, function() {

			callback();
		});
	}

	// Clone and override normal members
	for (var key in app.super) {

		// Member has Getter/Setter
		var desc = Object.getOwnPropertyDescriptor(app.super, key);

		if (desc.get || desc.set) {

			// It has getter
			if (desc.get) {
				app.__defineGetter__(key, (function(key) {
					return function() {
						return app.super[key];
					};
				})(key));
			}

			// It has setter
			if (desc.set) {
				app.__defineSetter__(key, (function(key) {
					return function(value) {
						app.super[key] = value;
					};
				})(key));
			}

			continue;
		}

		// Member is a function
		if (app.super[key] instanceof Function) {

			// Override method with own implementation
			if (key in Application.prototype)
				continue;

			app[key] = (function(key) {
				return function() {
					return app.super[key].apply(app.super, Array.prototype.slice.call(arguments));
				}
			})(key);

			continue;
		}

		// Normal Member
		app.__defineGetter__(key, (function(key) {
			return function() {
				return app.super[key];
			};
		})(key));

		app.__defineSetter__(key, (function(key) {
			return function(value) {
				app.super[key] = value;
			};
		})(key));
	}

	app.configure = function(callback) {

		var args = Array.prototype.slice.call(arguments);

		// Enable body parser
		app.use(express.bodyParser());

		// Super
		app.super['configure'].apply(app.super, args);

		return app;
	};

	app.listen = function() {

		var args = Array.prototype.slice.call(arguments);

		// Do some work before listen to port
		initialize(function() {
			app.super['listen'].apply(app.super, args);
		});

		return app;
	};

	// Create instance of internal class
	app.frexRouter = new Router(app);
	app.frexEngine = new Engine(app);
	app.frexAPIManager = new APIManager(app);
	app.frexRemote = new Remote(app);

	app.frex = {
		Engine: function(engineName) {
			var runtime = app.frexEngine.getRuntime(engineName);

			return (runtime) ? runtime.engine.instance : null;
		},
		Error: require('./extensions/error')
	};


	// Append frex.js APIs
	app.use(function(req, res, next) {

		// Create connection object
		req.conn = {
			req: req,
			res: res
		};

		req.frex = app.frex;

		next();
	});

	return app;
};
