
Frex.Remote = function() {
	var self = this;

	self._connectionID = null;
	self._eventConnection = null;
	self._commandConnection = null;
	self._running = false;
	self._queueID = 0;
	self._EventLastUpdatedTime = null;
	self._EventHandler = [];
	self._commandQueue = [];
	self._commandInfo = {};
	self._waitRef = 0;
    self._connectionParams = {};
};

Frex.Remote.prototype._makeCommand = function(objPath, cmd, args, callback) {
	var self = this;

	var commandInfo = {
		id: self._queueID++,
		objPath: objPath,
		cmd: cmd,
		args: args,
		callback: callback
	};

	var command = {
		id: self._queueID++,
		objPath: objPath,
		cmd: cmd,
		args: args,
		callback: true
	};

	// Add this command to queue
	self._commandQueue.push(command);
	self._commandInfo[command.id] = commandInfo;

	// It must wait for callback
	if (callback)
		self._waitRef++;
};

Frex.Remote.prototype._makeEventHandler = function(objPath, cmd, eventName, opts, callback) {
	var self = this;

	var commandInfo = {
		id: self._queueID++,
		objPath: objPath,
		cmd: cmd,
		event: eventName,
		opts: opts,
		callback: callback
	};

	var command = {
		id: self._queueID++,
		objPath: objPath,
		cmd: cmd,
		event: eventName,
		opts: opts,
		callback: true
	};

	// Add this command to queue
	self._EventHandler.push(command);
	self._commandInfo[command.id] = commandInfo;
};

Frex.Remote.prototype.callFunc = function(objPath, args, opts) {
	var self = this;

	var lastArg = args.length - 1;
	var callback = null;

	// Assume the last one argument is callback function
	if (args[lastArg] instanceof Function) {
		callback = args[lastArg];

		args.length--;
	}

	// TODO: support synchronous method
	if (opts) {
	}

	self._makeCommand(objPath, 'call', args, callback);
};

Frex.Remote.prototype.setValue = function(objPath, val, callback) {
	var self = this;

	self._makeCommand(objPath, 'set', val, callback);
};

Frex.Remote.prototype.setListener = function(objPath, eventName, opts, callback) {
	var self = this;

	self._makeEventHandler(objPath, 'on', eventName, opts, callback);
};

Frex.Remote.prototype.commit = function(completed) {
	var self = this;

	// There is no need to commit anything
	if (self._commandQueue.length == 0) {
		completed();
		return; 
	}

    var params = {
		id: self._connectionID,
		cmds: JSON.stringify(self._commandQueue)
    };

    if (typeof self._connectionParams === 'object'
        && Object.keys(self._connectionParams).length > 0) {
        params = JSON.parse((JSON.stringify(params) + JSON.stringify(self._connectionParams)).replace(/}{/g,','));
    }

	// TODO: Optimize queue with removing unnecessary tasks
	self._commandConnection = Frex.Network.post('/frex/remote', params, function(err, data) {

		if (err) {
			completed(err);
			return;
		}

		var events = JSON.parse(data);
		events.forEach(function(e, index, arr) {
			var cmdInfo = self._commandInfo[e.id] || null;
			if (!cmdInfo)
				return;

			// It require to execute callback function
			if (e.type == 'callback') {
				cmdInfo.callback.apply(window, e.args);
			}

			// Take off command from queue for waiting response
			if (cmdInfo.cmd != 'on')
				delete self._commandInfo[e.id];
		});

		// Completed
		completed();
	});

	// Clear command queue
	self._commandQueue = [];
};

Frex.Remote.prototype.makeEventConnection = function(completed) {
	var self = this;

	if (self._EventHandler.length == 0) {
		completed();

		return;
	}

    var params = {
		id: self._connectionID,
		on: JSON.stringify(self._EventHandler),
		ts: self._EventLastUpdatedTime
	};

    if (typeof self._connectionParams === 'object' 
        && Object.keys(self._connectionParams).length > 0) {
        params = JSON.parse((JSON.stringify(params) + JSON.stringify(self._connectionParams)).replace(/}{/g,','));
    }

	self._eventConnection = Frex.Network.post('/frex/remote/event', params, function(err, data) {

		if (err) {
			completed(err);
			return;
		}

		var eventSet = JSON.parse(data);
		var events = eventSet.events;
		events.forEach(function(e, index, arr) {
			var cmdInfo = self._commandInfo[e.id] || null;
			if (!cmdInfo)
				return;

			if (e.type == 'events') {

				e.events.forEach(function(es, index, arr) {

					// execute callback function to handle event
					setTimeout(function() {
						cmdInfo.callback.apply(window, es.args);
					}, 0);
				});
			}

		});

		// Update time
		self._EventLastUpdatedTime = eventSet.ts;

		// Completed
		completed();

	});
};

Frex.Remote.prototype.makeConnection = function() {
	var self = this;

	self._running = true;

	function _initEvent() {

		self.makeEventConnection(function(err) {

			if (!self._running)
				return;

			var interval = 0;

			// If we got error, trying to re-connect after 10 seconds
			if (err)
				interval = 10000;

			// Reconenct
			setTimeout(function() {
				_initEvent();
			}, interval);

		});
	}

	function _initCommiter() {

		self.commit(function() {

			if (!self._running)
				return;

			setTimeout(function() {
				_initCommiter();
			}, 100);
		});
	}

	_initEvent();
	_initCommiter();
};

Frex.Remote.prototype.closeConnection = function() {
	var self = this;

	self._running = false;

	if (self._eventConnection) {
		self._eventConnection.abort();
		self._eventConnection = null;
	}

	if (self._commandConnection) {
		self._commandConnection.abort();
		self._commandConnection = null;
	}
};

