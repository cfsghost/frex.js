var Frex = require('../../');

var app = Frex();

app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(Frex.cookieParser());
	app.use(Frex.cookieSession({
		key: 'fred.js',
		secret: 'FREX.JSISAWESOMEPIOUHSDLFJQWIOWJQKLSJDGHKAGHJSAGD'
	}));

    // CSRF middleware
    app.use(Frex.csrf());

    // Hack CSRF middleware
    // Cause the app start in the very first time, res.locals.token will get 'undefined' 
    // in your view. There is a little hack to make sure the CSRF token passed to the view.
    app.use(function(req, res, next) {
        if (req.session._csrf) res.locals.token = req.session._csrf;

        next();
    });

	app.use(app.router);
	app.use(Frex.static(__dirname + '/public'));
});

app.listen(8000, function() {
	console.log('website is ready.');
});
