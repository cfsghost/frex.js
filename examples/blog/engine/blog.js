"use strict";

// Private scope
var articles = [
	{
		title: 'Introduce Mandice Development Team',
		text: 'Have fun!',
		created: 1369578445487
	},
	{
		title: 'frex.js is Powerful Web Framework',
		text: 'Nice',
		created: 1369578435487
	}
];

var Blog = function() {
	var self = this;
};

Blog.prototype.articleCount = function() {
	return articles.length;
};

Blog.prototype.addArticle = function(article, callback) {
	var self = this;

	article.created = new Date().getTime();
	articles.push(article);

	if (callback)
		callback(null);
};

Blog.prototype.listArticles = function(opts, callback) {
	var self = this;

	if (callback)
		callback(null, articles);
};

module.exports = {
	type: 'engine',
	engine_name: 'Blog',
	instance: new Blog
};
