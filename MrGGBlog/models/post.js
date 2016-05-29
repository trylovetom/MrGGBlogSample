var mongodb = require('./db');

function Post(name, title, post) {
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {
	var date = new Date();
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post
	};
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// get collection of posts
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// insert post to collection
			collection.insert(post, {
				safe: true
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err); // failure, return error
				}
				callback(null); // return error is null
			});
		});
	});
};

// get post and information
Post.get = function(name, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// get collection of posts
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}
			// query post by time
			collection.find(query).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if (err) {
					return callback(err); // failure, return error
				}
				callback(null, docs) // success, return result and it's type is array
			});
		});
	});
};