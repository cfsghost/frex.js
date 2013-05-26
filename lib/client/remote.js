Frex.Remote = {};
Frex.Remote._queueID = 0;
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

Frex.Remote.commit = function() {

	// There is no need to commit anything
	if (Frex.Remote._commandQueue.length == 0)
		return; 

	Frex.Remote._committing = true;

	// TODO: Optimize queue to take off unnecessary tasks
	Frex.Network.post('/frex/remote', {
		cmds: JSON.stringify(Frex.Remote._commandQueue)
	},function(err, data) {
		// Done
		Frex.Remote._committing = false;

		var events = JSON.parse(data);
		events.forEach(function(e, index, arr) {
			var cmdInfo = Frex.Remote._commandInfo[e.id] || null;
			if (!cmdInfo)
				return;

			if (e.type == 'callback')
				cmdInfo.callback.apply(window, e.args);
		});
	});

	Frex.Remote._commandQueue = [];
};

Frex.Remote.makeConnection = function() {

	function _loop() {

		if (!Frex.Remote._committing)
			Frex.Remote.commit();

		setTimeout(_loop, 100);
	}

	_loop();
};
