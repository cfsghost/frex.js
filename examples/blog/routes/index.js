module.exports = {
	'/': function(req, res) {
		res.render('index');
	},
	'/post': function(req, res) {
		res.render('post');
	}
};
