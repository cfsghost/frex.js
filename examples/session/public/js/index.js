
// If not yet login, you should get forbidden message when loading "Secret" engine
App.require([ 'Secret', 'Session' ], function() {
	var session = App.Engine('Session');

	// return null if not login yet
	var secret = App.Engine('Secret');
	if (secret) {
		var secretBlock = document.getElementById('secret_block');
		secretBlock.innerText = secret.message;
	}

	var defaultLayout = document.getElementById('default_layout');
	var loginButton = document.getElementById('login_button');

	var loginedLayout = document.getElementById('logined_layout');
	var logoutButton = document.getElementById('logout_button');

	// Check session
	session.isLogin(function(logined) {

		if (logined) {
			defaultLayout.style.display = 'none';
			loginedLayout.style.display = '';
		} else {
			defaultLayout.style.display = '';
			loginedLayout.style.display = 'none';
		}
	});

	loginButton.onclick = function() {

		session.auth('fred', 'stacy', function(err) {
			if (err)
				return;

			defaultLayout.style.display = 'none';
			loginedLayout.style.display = '';
		});
	};

	logoutButton.onclick = function() {

		session.signOut(function() {
			defaultLayout.style.display = '';
			loginedLayout.style.display = 'none';
		});
	};
});
