Frex.CoreEngine = {};

Frex.CoreEngine = function(engineName) {
	var self = this;

	self.runner = {};
	self.engineName = engineName;
};

Frex.CoreEngine.prototype.compile = function(inline) {
	var self = this;
	var objPath = inline.path.join('.');
	var exec = null;

	switch(inline.type) {
	case 'c':
		exec = 'self.runner.' + objPath + ' = {};';
		break;

	case 'f':
		var func = new Frex.Objects.FunctionObject(self.engineName, objPath);

		exec = 'self.runner.' + objPath + ' = ' + func.toString() + ';';

		break;
	}

	eval(exec);
};
