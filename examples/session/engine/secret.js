"use strict";

var Secret = function() {
	var self = this;

	self.message = 'Fred loves Stacy';
};

module.exports = {
	type: 'engine',
	engine_name: 'Secret',
	prototype: Secret,
	checkPermission: function(req, res, callback) {
		try {

			// Allow to access this engine
			if (req.session.logined) {
				callback(true);
				return;
			}
		} catch(e) {}

		// Permission denied
		callback(false);
	}
};
