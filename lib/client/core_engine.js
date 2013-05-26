Frex.CoreEngine = {};

Frex.CoreEngine = function(engineName) {
	var self = this;

	self.runner = {};
	self.ref = {};
	self.engineName = engineName;
};

Frex.CoreEngine.prototype.compile = function(inline) {
	var self = this;
	var exec = '';
	var refExec = '';

	switch(inline.type) {
	case 'c':
		var objPath = inline.path.join('.');
		exec = 'self.runner.' + objPath + ' = {};';
		refExec = 'self.ref.' + objPath + ' = {};';
		break;

	case 'f':
		var objPath = inline.path.join('.');
		var func = new Frex.Objects.FunctionObject(self.engineName, objPath);

		exec = 'self.runner.' + objPath + ' = ' + func.toString() + ';';
		refExec = 'self.ref.' + objPath + ' = {};';

		break;

	case 'v':
		var propName = inline.path[inline.path.length - 1];
		var parentPath = inline.path.slice(0, inline.path.length - 1).join('.');
		var objPath = inline.path.join('.');
		var getter = new Frex.Objects.ValueGetterObject(self, objPath);
		var setter = new Frex.Objects.ValueSetterObject(self, objPath);

		exec = 'self.runner.' + parentPath + '.__defineGetter__(\'' + propName + '\',' + getter.toString() + ');';
		exec += 'self.runner.' + parentPath + '.__defineSetter__(\'' + propName + '\',' + setter.toString() + ');';

		refExec = 'self.ref.' + objPath + ' = \'' + escape(inline.val) + '\';';

		break;

	}

	eval(exec);
	eval(refExec);
};
