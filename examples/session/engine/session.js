"use strict";

var Session = function() {
	var self = this;
};

Session.prototype.auth = function(username, password, callback) {
	var self = this;

	var conn = Session.frex.getConnection(arguments);

	if (username == 'fred' && password == 'stacy') {
		if (!conn.req.session)
			conn.req.session = {};

		conn.req.session.logined = true;

		callback(null);

		return;
	}

	callback(new Error('incorrect username or password'));
};

Session.prototype.signOut = function(callback) {

	var conn = Session.frex.getConnection(arguments);

	if (!conn.req.session)
		conn.req.session = {};

	conn.req.session.logined = false;

	callback(null);
};

Session.prototype.isLogin = function(callback) {

	var conn = Session.frex.getConnection(arguments);

	try {
		if (conn.req.session.logined) {

			callback(true);
			return;
		}

	} catch(e) {}

	callback(false);
};

module.exports = {
	type: 'engine',
	engine_name: 'Session',
	prototype: Session
};
