Frex.Objects = {};

Frex.Objects.FunctionObject = function(engineName, objPath) {

	return function() {
		Frex.Remote.callFunc(objPath, Array.prototype.slice.call(arguments));
	};
}; 

Frex.Objects.ValueGetterObject = function(engine, objPath) {

	return function() {
		return eval('self.ref.' + objPath);
	};
};

Frex.Objects.ValueSetterObject = function(engineName, objPath) {

	return function() {
	};
};
