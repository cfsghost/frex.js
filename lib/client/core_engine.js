Frex.CoreEngine = {};

Frex.CoreEngine = function(engineName) {
	var self = this;

	self.runner = {};
	self.ref = {};
	self.engineName = engineName;

	// Event emitter paths
	self.eventEmitterPaths = [
		engineName,
		'on'
	];
	self.eventEmitterPath = self.eventEmitterPaths.join('.');
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

		// It's a function of EventEmitter
		if (objPath == self.eventEmitterPath) {
			var func = new Frex.Objects.EventHandlerObject(self.engineName, objPath);
		} else {

			var func = new Frex.Objects.FunctionObject(self.engineName, objPath);
		}

		exec = 'self.runner.' + objPath + ' = ' + func.toString() + ';';
		refExec = 'self.ref.' + objPath + ' = {};';

		break;

	case 'v':
		var propName = inline.path[inline.path.length - 1];
		var parentPath = inline.path.slice(0, inline.path.length - 1).join('.');
		var objPath = inline.path.join('.');
		var getter = new Frex.Objects.ValueGetterObject();
		var setter = new Frex.Objects.ValueSetterObject();

		exec = 'self.runner.' + parentPath + '.__defineGetter__(\'' + propName + '\',' + getter.toString() + ');';
		exec += 'self.runner.' + parentPath + '.__defineSetter__(\'' + propName + '\',' + setter.toString() + ');';

		refExec = 'self.ref.' + objPath + ' = \'' + inline.val.replace(/\'/, '\\\'') + '\';';

		break;

	}

	eval(exec);
	eval(refExec);
};
