"use strict";

var Session = function() {
	var self = this;
};

Session.prototype.auth = function(username, password, callback, data) {
	var self = this;

	if (username == 'fred' && password == 'stacy') {
		if (!data.req.session)
			data.req.session = {};

		data.req.session.logined = true;

		callback(null);

		return;
	}

	callback(new Error('incorrect username or password'));
};

Session.prototype.signOut = function(callback, data) {
	if (!data.req.session)
		data.req.session = {};

	data.req.session.logined = false;

	callback(null);
};

Session.prototype.isLogin = function(callback, data) {

	try {
		if (data.req.session.logined) {

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
