Frex.Objects = {};

Frex.Objects.FunctionObject = function(engineName, objPath) {

	return function() {
		self.app.remote.callFunc(objPath, Array.prototype.slice.call(arguments));
	};
}; 

Frex.Objects.ValueGetterObject = function() {

	return function() {
		return eval('self.ref.' + objPath);
	};
};

Frex.Objects.ValueSetterObject = function(engine) {

	return function(val) {

		eval('self.ref.' + objPath + ' = \'' + val.replace(/\'/, '\\\'') + '\';');

		self.app.remote.setValue(objPath, val, (function() {
			// TODO: if failed to set this property, roll back value.
		}));
	};
};

Frex.Objects.EventHandlerObject = function(engineName, objPath) {

	return function(eventName, callback) {

		self.app.remote.setListener(objPath, eventName, {}, callback);
	};
};
