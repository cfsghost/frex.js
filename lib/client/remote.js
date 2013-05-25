Frex.Remote = {};
Frex.Remote._queueID = 0;
Frex.Remote._commandQueue = [];
Frex.Remote._commandInfo = {};
Frex.Remote._waitRef = 0;

Frex.Remote._makeCommand = function(objPath, cmd, args, callback) {
	var command = {
		id: Frex.Remote._queueID++,
		objPath: objPath,
		cmd: cmd,
		args: args,
		callback: callback
	};

	// Add this command to queue
	Frex.Remote._commandQueue.push(command);
	Frex.Remote._commandInfo[command.id] = command;

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

	// TODO: Optimize queue to take off unnecessary tasks
	Frex.Network.post('/frex/remote', {
		cmds: Frex.Remote._commandQueue
	},function(err, data) {
		// Done
	});
};

Frex.Remote.receive = function() {
	if (Frex.Remote._waitRef == 0)
		return;

	// TODO: Try to get event from remote, and remove tasks of queue which is waiting for callback.
}

Frex.Remote.connection = function() {

	function _loop() {
		
		Frex.Remote.commit();
		Frex.Remote.receive();

		setTimeout(_loop, 100);
	}

	_loop();
};
