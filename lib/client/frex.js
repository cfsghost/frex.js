
var Frex = function() {
	var self = this;

	self.engines = {};

	Frex.Remote.makeConnection();
};

Frex.prototype.require = function() {
	var self = this;

	var engines = null;
	var callback = arguments[1];

	if (arguments[0] instanceof Array) {
		engines = arguments[0];
	} else {
		engines = [ arguments[0] ];
	}

	// Loading specific engines
	var completed = 0;

	engines.forEach(function(engineName, index, arr) {

		// The engine exists, we ignore it
		if (self.engines[engineName]) {
			completed++;
			return true;
		}

		Frex.Network.get('/frex/engine/' + engineName, function(err, bytecode) {
			completed++;

			if (err)
				return;

			if (bytecode == null)
				return;

			// Create a new engine
			var engine = new Frex.CoreEngine(engineName);

			// Compile bytecode of engine
			eval(bytecode).forEach(function(inline, index, arr) {
				engine.compile(inline);
			});

			// Register
			self.engines[engineName] = engine;
		});
	});

	function _checkStatus() {

		// All engine was loaded
		if (completed == engines.length) {
			callback();
			return;
		}
	
		setTimeout(_checkStatus, 0);
	}

	_checkStatus();
};

Frex.prototype.Engine = function(engineName) {
	var self = this;

	try {
		return self.engines[engineName].runner[engineName];
	} catch(e) {}

	return null;
};
