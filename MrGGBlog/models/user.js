var mongodb = require('./db');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

// save user information
User.prototype.save = function(callback) {
	var user = {
		name: this.name, 
		password: this.password, 
		email: this.email
	};

	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err); // error, return err information
		}

		// read uses collection
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err); // error, return err information
			}

			// insert information in users collection
			collection.insert(user, {
				safe: true
			}, function(err, user) {
				mongodb.close();
				if (err) {
					return callback(err); // error, return err information
				}
				callback(null, user[0]); // success! return err is null and first user
			});
		});
	});
};

// read user information
User.get = function(name, callback) {

	// open db
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err); // error, return err information
		}

		// read users collection
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err); // error, return error information
			}

			// find user by user name
			collection.findOne({
				name: name
			}, function(err, user) {
				mongodb.close();
				if (err) {
					return callback(err); // error! return error information
				}
				callback(null, user); // success! return query user information
			});
		});
	});
};