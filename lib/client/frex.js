
var Frex = function() {
	var self = this;

	self.engines = {};
	self.remote = new Frex.Remote(self);

	self.remote.makeConnection();
};

Frex.prototype.setConnectionID = function(id) {
	var self = this;

	self.remote.closeConnection();
	self.remote._connectionID = id;

	setTimeout(function() {
		self.remote.makeConnection();
	}, 100);
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

	Frex.Network.post('/frex/engine', { engines: JSON.stringify(engines) }, function(err, bytecodes) {

		if (err)
			return;

		if (bytecodes == null)
			return;

		var engine_codes = JSON.parse(bytecodes);
		for (var engineName in engine_codes) {
			var bytecode = engine_codes[engineName];

			// Create a new engine
			var engine = new Frex.CoreEngine(self, engineName);

			// Compile bytecode of engine
			eval(bytecode).forEach(function(inline, index, arr) {
				engine.compile(inline);
			});

			// Register
			self.engines[engineName] = engine;
		}

		callback();
	});
};

Frex.prototype.Engine = function(engineName) {
	var self = this;

	try {
		return self.engines[engineName].runner[engineName];
	} catch(e) {}

	return null;
};
