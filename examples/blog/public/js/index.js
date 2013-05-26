
App.require('Blog', function() {
	var blog = App.Engine('Blog');

	blog.listArticles({}, function(err, articles) {
		console.log(articles);

		// Render all
		articles.forEach(function(article, index, arr) {
			var doc = document.createElement('div');

			// Title
			var title = document.createElement('div');
			title.className = 'doc_title';
			title.innerText = article.title;

			// Text
			var text = document.createElement('div');
			text.className = 'doc_text';
			text.innerText = article.text;

			doc.appendChild(title);
			doc.appendChild(text);

			document.getElementById('articles_layout').appendChild(doc);
		});
	});

	blog.title = 'Test';

	console.log(blog.title);
});
