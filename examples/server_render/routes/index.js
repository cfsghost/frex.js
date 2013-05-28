module.exports = {
	'/': function(req, res) {
		var products = req.frex.Engine('Products');

		products.list(function(err, items) {

			res.render('index', {
				title: 'Rendering in server-side',
				items: items
			});

		});
	}
};
