var Frex = require('../../');

var app = Frex();

app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(Frex.cookieParser());
	app.use(Frex.cookieSession({
		key: 'fred.js',
		secret: 'FREX.JSISAWESOMEFREDWASBORNON15NOV1985INTAIPEI'
	}));
	app.use(app.router);
	app.use(Frex.static(__dirname + '/public'));
});

app.listen(8000, function() {
	console.log('website is ready.');
});
