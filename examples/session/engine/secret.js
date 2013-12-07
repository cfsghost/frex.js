"use strict";

var Secret = function() {
	var self = this;

	self.message = 'Fred loves Stacy';
};

module.exports = {
	type: 'engine',
	engine_name: 'Secret',
	prototype: Secret,
	check_permission: function(callback) {

		var conn = this.frex.getConnection(arguments);

		try {

			// Allow to access this engine
			if (conn.req.session.logined) {
				callback(true);
				return;
			}
		} catch(e) {}

		// Permission denied
		callback(false);
	}
};
