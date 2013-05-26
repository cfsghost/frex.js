Frex.Objects = {};

Frex.Objects.FunctionObject = function(engineName, objPath) {
	var self = this;

	// Create a new scope to store information
	return (function(engineName, objPath) {
		return function() {
			console.log(objPath);
			Frex.Remote.callFunc(objPath, Array.prototype.slice.call(arguments));
		};
	})(engineName, objPath);
}; 
