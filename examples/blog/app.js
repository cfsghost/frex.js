var Frex = require('../../');

var app = Frex();

app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
});

app.listen(8080);
