"use strict";

var Array = require('node-array');
var path = require('path');
var util = require('util');
var events = require('events');

var Router = require('./router');
var Engine = require('./engine');
var APIManager = require('./api_manager');
var Remote = require('./remote');

// Inherit express
var express = require('express');

var Application = module.exports = function() {
	var self = this;

	var requiredConfigure = false;
	var appInitialized = false;
	// Create a new express application
	var expressSuper = express();
	var app = function() {
		var args = Array.prototype.slice.call(arguments);
		if (!appInitialized) {
			appInitialized = true;
			initialize(function() {
				expressSuper.apply(this, args);
			});

			return;
		}

		expressSuper.apply(this, args);
	};

	app.super = expressSuper;

	function initialize(callback) {

		var tasks = [
			function(complete) {
				// Initializing API manager
				app.frexEngine.initRoutes(function() {
					complete();
				});
			}, function(complete) {
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
				// Initializing Router 
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

	function configure() {

		// Initializing Engine
		app.frexEngine.configureAllEngines(function() {
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

		requiredConfigure = true;

		var args = Array.prototype.slice.call(arguments);

		self.once('configure', function() {

			app.super['configure'].apply(app.super, args);

			self.emit('configured');
		});


		return app;
	};

	app.listen = function() {

		var args = Array.prototype.slice.call(arguments);

		self.once('configured', function() {

			// Initializing frex.js
			initialize(function() {

				app.super['configure'].apply(app.super, [ configure ]);
				app.super['listen'].apply(app.super, args);
			});
		});

		// Enable body parser
		app.use(express.bodyParser());

		// initializing engine
		app.frexEngine.init(function() {

			if (requiredConfigure) {
				self.emit('configure');
			} else {
				self.emit('configured');
			}
		});

		return app;
	};

	// Connection object prototype
	var Connection = function() {};

	// frex.js APIs
	app.frex = {
		Engine: function(engineName) {
			var runtime = app.frexEngine.getRuntime(engineName);

			return (runtime) ? runtime.engine.instance : null;
		},
		setEngine: function(engineName, settings) {
			var runtime = app.frexEngine.getRuntime(engineName);

			if (runtime)
				runtime.engine.settings = settings || {};
		},
		getConnection: function(args) {

			if (!args.length)
				return null;

			var lastArg = args[args.length - 1];
			if (Connection.prototype === Object.getPrototypeOf(lastArg)) {
				return lastArg;
			}

			return null;
		},
		getRequest: function(args) {

			var conn = this.getConnection(args);
			if (conn)
				return conn.req;

			return null;
		},
		getResponse: function(args) {

			var conn = this.getConnection(args);
			if (conn)
				return conn.res;

			return null;
		},
		Error: require('./extensions/error')
	};

	app.use(function(req, res, next) {

		// Create connection object
		req.conn = new Connection();
		req.conn.req = req;
		req.conn.res = res;

		req.frex = app.frex;

		next();
	});

	// Create instance of internal class
	app.frexRouter = new Router(app);
	app.frexEngine = new Engine(app);
	app.frexAPIManager = new APIManager(app);
	app.frexRemote = new Remote(app);

	// Set paths
	var mainPath = path.dirname(require.main.filename);
	app.frexEngine.addPath(path.join(mainPath, 'engine'));
	app.frexRouter.addPath(path.join(mainPath, 'routes'));

	return app;
};

util.inherits(Application, events.EventEmitter);
