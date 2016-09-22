var mongodb = require('./db');

function Comment(name, day, title, comment) {
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;

// Save a comment
Comment.prototype.save = function(callback) {
	var name = this.name,
		day = this.day,
		title = this.title,
		comment = this.comment;
	// Open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// Get posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Add comment to comments
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$push: {
					"comments": comment
				}
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};