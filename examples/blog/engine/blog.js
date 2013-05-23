"use strict";

var articles = [];

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

Blog.prototype.listArticles = function(callback) {
	var self = this;

	callback(null, articles);
};

module.exports = {
	engine_name: 'Blog',
	instance: new Blog
};
