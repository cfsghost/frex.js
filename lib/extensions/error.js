"use strict";

var FrexError = module.exports = function() {
	var self = this;

	var e = {};
	if (arguments[0] instanceof Error) {

		e = {
			name: arguments[0].name,
			message: arguments[0].message
		};
	} else if (arguments.length == 3) {

		e = {
			name: arguments[0],
			code: arguments[1],
			message: arguments[2]
		}
	} else if (arguments.length == 1) {

		e = {
			name: 'Error',
			message: arguments[0]
		}
	} else if (typeof arguments[1] === 'number') {

		e = {
			name: arguments[0],
			code: arguments[1]
		}
	} else {

		e = {
			name: arguments[0],
			message: arguments[1]
		}
	}

	return e
};
