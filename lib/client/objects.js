Frex.Objects = {};

Frex.Objects.FunctionObject = function(engineName, objPath) {
	var self = this;

	// Create a new scope to store information
	self.engineName = engineName;
	self.objPath = objPath;

	return function() {
		Frex.Remote.callFunc(self.engineName, arguments);
	};
}; 
