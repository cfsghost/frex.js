Frex.Remote = {};
Frex.Remote._queueID = 0;
Frex.Remote._EventLastUpdatedTime = null;
Frex.Remote._EventHandler = [];
Frex.Remote._commandQueue = [];
Frex.Remote._commandInfo = {};
Frex.Remote._committing = false;
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

Frex.Remote.commit = function() {

	// There is no need to commit anything
	if (Frex.Remote._commandQueue.length == 0)
		return; 

	Frex.Remote._committing = true;

	// TODO: Optimize queue to take off unnecessary tasks
	var connection = Frex.Network.post('/frex/remote', {
		cmds: JSON.stringify(Frex.Remote._commandQueue)
	}, function(err, data) {
		Frex.Remote._committing = false;

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
	});
};

Frex.Remote.makeEventConnection = function() {

	if (Frex.Remote._EventHandler.length == 0) {
		setTimeout(function() {
			Frex.Remote.makeEventConnection();
		}, 0);

		return;
	}

	Frex.Network.post('/frex/remote/event', {
		on: JSON.stringify(Frex.Remote._EventHandler),
		ts: Frex.Remote._EventLastUpdatedTime
	}, function(err, data) {

		// Reconenct in 10 seconds
		if (err) {
			setTimeout(function() {
				Frex.Remote.makeEventConnection();
			}, 10000);

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

		// Reconenct
		setTimeout(function() {
			Frex.Remote.makeEventConnection();
		}, 0);
	});
};

Frex.Remote.makeConnection = function() {

	Frex.Remote.makeEventConnection();

	function _loop() {

		if (!Frex.Remote._committing)
			Frex.Remote.commit();

		setTimeout(_loop, 100);
	}

	_loop();
};
