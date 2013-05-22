var Frex = require('../../');

var app = Frex();

app.get('/', function(req, res){
	res.send('hello world');
});

app.listen(8080);
