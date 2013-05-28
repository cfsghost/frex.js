"use strict";

var products = [
	{ name: 'Blue T-shirt', price: 100 },
	{ name: 'Black Shoes', price: 500 },
	{ name: 'White Hat', price: 1000 },
	{ name: 'Red Socks', price: 50 },
];

var Products = function() {
	var self = this;
};

Products.prototype.list = function(callback) {

	callback(null, products);
};

module.exports = {
	type: 'engine',
	engine_name: 'Products',
	prototype: Products
};
