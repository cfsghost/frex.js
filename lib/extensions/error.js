"use strict";

var FrexError = module.exports = function() {
	var self = this;

	var e = {};
	if (arguments[0] instanceof Error) {

		e = {
			name: arguments[0].name,
			message: arguments[0].message
		};
	} else {

		e = {
			name: arguments[0],
			message: arguments[1]
		}
	}

	return e
};
