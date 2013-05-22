var Frex = require('../../');

var app = Frex();

app.get('/', function(req, res){
	res.send('Hello World');
});

app.listen(8080);
