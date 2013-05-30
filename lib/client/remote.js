Frex.Remote = {};
Frex.Remote._connectionID = null;
Frex.Remote._eventConnection = null;
Frex.Remote._commandConnection = null;
Frex.Remote._running = false;
Frex.Remote._queueID = 0;
Frex.Remote._EventLastUpdatedTime = null;
Frex.Remote._EventHandler = [];
Frex.Remote._commandQueue = [];
Frex.Remote._commandInfo = {};
Frex.Remote._waitRef = 0;

Frex.Remote._makeCommand = function(objPath, cmd, args, callback) {
	var commandInfo = {
		id: Frex.Remote._queueID++,
		objPath: objPath,
		cmd: cmd,
		args: args,
		callback: callback
	};

	var command = {
		id: Frex.Remote._queueID++,
		objPath: objPath,
		cmd: cmd,
		args: args,
		callback: true
	};

	// Add this command to queue
	Frex.Remote._commandQueue.push(command);
	Frex.Remote._commandInfo[command.id] = commandInfo;

	// It must wait for callback
	if (callback)
		Frex.Remote._waitRef++;
};

Frex.Remote._makeEventHandler = function(objPath, cmd, eventName, opts, callback) {
	var commandInfo = {
		id: Frex.Remote._queueID++,
		objPath: objPath,
		cmd: cmd,
		event: eventName,
		opts: opts,
		callback: callback
	};

	var command = {
		id: Frex.Remote._queueID++,
		objPath: objPath,
		cmd: cmd,
		event: eventName,
		opts: opts,
		callback: true
	};

	// Add this command to queue
	Frex.Remote._EventHandler.push(command);
	Frex.Remote._commandInfo[command.id] = commandInfo;
};

Frex.Remote.callFunc = function(objPath, args, opts) {
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

	Frex.Remote._makeCommand(objPath, 'call', args, callback);
};

Frex.Remote.setValue = function(objPath, val, callback) {
	Frex.Remote._makeCommand(objPath, 'set', val, callback);
};

Frex.Remote.setListener = function(objPath, eventName, opts, callback) {
	Frex.Remote._makeEventHandler(objPath, 'on', eventName, opts, callback);
};

Frex.Remote.commit = function(completed) {

	// There is no need to commit anything
	if (Frex.Remote._commandQueue.length == 0) {
		completed();
		return; 
	}

	// TODO: Optimize queue with removing unnecessary tasks
	Frex.Remote._commandConnection = Frex.Network.post('/frex/remote', {
		id: Frex.Remote._connectionID,
		cmds: JSON.stringify(Frex.Remote._commandQueue)
	}, function(err, data) {

		if (err) {
			commpleted(err);
			return;
		}

		var events = JSON.parse(data);
		events.forEach(function(e, index, arr) {
			var cmdInfo = Frex.Remote._commandInfo[e.id] || null;
			if (!cmdInfo)
				return;

			// It require to execute callback function
			if (e.type == 'callback') {
				cmdInfo.callback.apply(window, e.args);
			}

			// Take off command from queue for waiting response
			if (cmdInfo.cmd != 'on')
				delete Frex.Remote._commandInfo[e.id];
		});

		// Clear command queue
		Frex.Remote._commandQueue = [];

		// Completed
		completed();
	});
};

Frex.Remote.makeEventConnection = function(completed) {

	if (Frex.Remote._EventHandler.length == 0) {
		completed();

		return;
	}

	Frex.Remote._eventConnection = Frex.Network.post('/frex/remote/event', {
		id: Frex.Remote._connectionID,
		on: JSON.stringify(Frex.Remote._EventHandler),
		ts: Frex.Remote._EventLastUpdatedTime
	}, function(err, data) {

		if (err) {
			completed(err);
			return;
		}

		var eventSet = JSON.parse(data);
		var events = eventSet.events;
		events.forEach(function(e, index, arr) {
			var cmdInfo = Frex.Remote._commandInfo[e.id] || null;
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
		Frex.Remote._EventLastUpdatedTime = eventSet.ts;

		// Completed
		completed();

	});
};

Frex.Remote.makeConnection = function() {

	Frex.Remote._running = true;

	function _initEvent() {

		Frex.Remote.makeEventConnection(function(err) {

			if (!Frex.Remote._running)
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

		Frex.Remote.commit(function() {

			if (!Frex.Remote._running)
				return;

			setTimeout(function() {
				_initCommiter();
			}, 100);
		});
	}

	_initEvent();
	_initCommiter();
};

Frex.Remote.closeConnection = function() {

	Frex.Remote._running = false;

	if (Frex.Remote._eventConnection) {
		Frex.Remote._eventConnection.abort();
		Frex.Remote._eventConnection = null;
	}

	if (Frex.Remote._commandConnection) {
		Frex.Remote._commandConnection.abort();
		Frex.Remote._commandConnection = null;
	}
};
