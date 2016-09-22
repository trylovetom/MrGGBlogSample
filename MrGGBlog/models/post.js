var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, tags, post) {
	this.name = name;
	this.title = title;
	this.tags = tags;
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
		tags: this.tags,
		post: this.post,
		comments: [],
		pv: 0
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

// get on post
Post.getOne = function(name, day, title, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// get posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// qurey by name, day, title
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title,
			}, function(err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				// parse markdown to html
				if (doc) {
					// per get, add pv
					collection.update({
						"name": name,
						"time.day": day,
						"title": title
					}, {
						$inc: {
							"pv": 1
						}
					}, function(err) {
						mongodb.close();
						if (err) {
							return callback(err);
						}
					});
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment) {
						comment.content = markdown.toHTML(comment.content);
					});
				}
				callback(null, doc); // callback one post
			});
		});
	});
};

// get post and information
Post.getAll = function(name, callback) {
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
				docs.forEach(function(doc) {
					doc.post = markdown.toHTML(doc.post);
				});
				callback(null, docs) // success, return result and it's type is array
			});
		});
	});
};

// get 10 posts
Post.getTen = function(name, page, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// get posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}
			// use count
			collection.count(query, function(err, total) {
				// based on query，jump to (page - 1) * 10, return 10 resutls
				collection.find(query, {
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function(err, docs) {
					mongodb.close();
					if (err) {
						return callback(err);
					}
					// parse markdown to html
					docs.forEach(function(doc) {
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null, docs, total);
				});
			});
		});
	});
};

// get post of post(markdown format)
Post.edit = function(name, day, title, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// get posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// query by name, data, title
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, doc); // return a psot(markdown format)
			});
		});
	});
};

// update post
Post.update = function(name, day, title, post, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// get posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// update post of post
			collection.update({
					"name": name,
					"time.day": day,
					"title": title
				}, {
					$set: {
						post: post
					}
				},
				function(err) {
					mongodb.close();
					if (err) {
						return callback(err);
					}
					callback(null);
				});
		});
	});
};

// remove post 
Post.remove = function(name, day, title, callback) {
	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// get collections
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// remove the file
			collection.remove({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				w: 1
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

// Get all post archive message
Post.getArchive = function(callback) {
	// Open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// get posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// return name, time, title
			collection.find({}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

// Get tags
Post.getTags = function(callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// distinct is that find dif value
			collection.distinct('tags', function(err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

// Get all post by tag
Post.getTag = function(tag, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// query all post with tag
			collection.find({
				"tags": tag
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

Post.search = function(keyword, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			var pattern = new RegExp(keyword, "i");

			collection.find({
				"title": pattern
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};