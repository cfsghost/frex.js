
// Example
App.require('Chat', function() {
	var chat = App.Engine('Chat');

	var usernameLayout = document.getElementById('username_layout');
	var username = document.getElementById('username');
	var sayLayout = document.getElementById('say_layout');
	var say = document.getElementById('say');

	username.focus();

	username.onkeypress = function(e) {
		if (e.keyCode != 13)
			return;

		usernameLayout.style.display = 'none';
		sayLayout.style.display = '';

		say.focus();
	}

	say.onkeypress = function(e) {

		if (e.keyCode != 13)
			return;

		chat.addMessage(username.value, say.value, function() {
			// Sent
		});

		// Clear input box
		say.value = '';
	}

	chat.on('message', function(msg) {
		var messages = document.getElementById('messages');
		var message = document.createElement('div');

		message.innerText = msg.user + ':' + msg.msg;

		messages.appendChild(message);
	});
});
