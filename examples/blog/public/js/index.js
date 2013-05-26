
App.require('Blog', function() {
	var blog = App.Engine('Blog');

	blog.listArticles({}, function(err, articles) {

		// Render all
		articles.forEach(function(article, index, arr) {
			var doc = document.createElement('div');

			// Title
			var title = document.createElement('h3');
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

	blog.test = 'Client';
});
