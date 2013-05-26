
App.require('Blog', function() {
	var blog = App.Engine('Blog');

	console.log('===== ' + blog.title);
	window.title = blog.title;

	blog.listArticles({}, function(err, articles) {
		console.log(articles);
	});
});
