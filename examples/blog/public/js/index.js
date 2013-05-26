
App.require('Blog', function() {
	var blog = App.Engine('Blog');

	blog.listArticles({}, function(err, articles) {
		console.log(articles);
	});

	blog.title = 'Test';

	console.log(blog.title);
});
