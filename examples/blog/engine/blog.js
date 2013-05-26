"use strict";

// Private scope
var articles = [
	{
		title: 'Introduce Mandice Development Team',
		text: 'Have fun!'
	},
	{
		title: 'frex.js is Powerful Web Framework',
		text: 'Nice'
	}
];

var Blog = function() {
	var self = this;
};

Blog.prototype.articleCount = function() {
	return articles.length;
};

Blog.prototype.addArticle = function(article) {
	var self = this;

	articles.push(article);
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
