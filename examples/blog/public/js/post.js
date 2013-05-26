
App.require('Blog', function() {
	var blog = App.Engine('Blog');

	var postBtn = document.getElementById('post_button');
	postBtn.onclick = function() {
		blog.addArticle({
			title: document.getElementById('doc_title').value,
			text: document.getElementById('doc_text').value
		}, function() {
			location.href = '/';
		});
	};
});

