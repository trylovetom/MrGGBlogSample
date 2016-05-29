var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');

// index
router.get('/', function(req, res, next) {
	Post.get(null, function(err, posts) {
		if (err) {
			posts = [];
		}
		res.render('index', {
			title: '主頁',
			user: req.session.user,
			posts: posts,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

// reg
router.get('/reg', checkNotLogin);
router.get('/reg', function(req, res, next) {
	res.render('reg', {
		title: '註冊',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});

router.post('/reg', checkNotLogin);
router.post('/reg', function(req, res, next) {
	var name = req.body.name;
	var password = req.body.password;
	var password_re = req.body['password-repeat'];

	// check password is same as password-repeat
	if (password_re != password) {
		req.flash('error', '兩次密碼不一致！');
		return res.redirect('/reg'); // redirect to register page
	}

	// create password as md5
	var md5 = crypto.createHash('md5');
	var password = md5.update(req.body.password).digest('hex');
	var newUser = new User({
		name: req.body.name,
		password: password,
		email: req.body.email
	});

	// check user is existed
	User.get(newUser.name, function(err, user) {
		if (user) {
			req.flash('error', err);
			return res.redirect('/reg'); // register fail redirect to regiser page
		}

		// if user is't existed
		newUser.save(function(err, user) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/reg'); // register fail redirect to regiser page
			}
			req.session.user = user; // save the use data in session
			req.flash('success', '註冊成功！');
			res.redirect('/'); // register success, redirect to home page
		});
	});
});

// login
router.get('/login', checkNotLogin);
router.get('/login', function(req, res, next) {
	res.render('login', {
		title: '登錄',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});

router.post('/login', checkNotLogin);
router.post('/login', function(req, res, next) {
	// create md5 of password
	var md5 = crypto.createHash('md5');
	var password = md5.update(req.body.password).digest('hex');

	// check user is exist
	User.get(req.body.name, function(err, user) {
		if (!user) {
			req.flash('error', '用戶不存在！');
			return res.redirect('/login'); // redirect to login page, if user isn't exist
		}
		// check password is correct
		if (user.password != password) {
			req.flash('error', '密碼錯誤！');
			return res.redirect('/login'); // redirect to login page, if password isn't crrect
		}
		// save user information to session
		req.session.user = user;
		req.flash('error', '登陸成功！');
		res.redirect('/'); // redirect to home page
	});
})

// post
router.get('/post', checkLogin);
router.get('/post', function(req, res, next) {
	res.render('post', {
		title: '發表',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});

router.post('/post', checkLogin);
router.post('/post', function(req, res, next) {
	var currentUser = req.session.user;
	var post = new Post(currentUser.name, req.body.title, req.body.post);

	post.save(function(err) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		req.flash('success', '發佈成功！');
		res.redirect('/'); // success and redirect to home page
	});
});

// logout
router.get('/logout', checkLogin);
router.get('/logout', function(req, res, next) {
	req.session.user = null;
	req.flash('success', '登出成功！');
	res.redirect('/'); // redirect to home page, after logout
});

// check login
function checkLogin(req, res, next) {
	if (!req.session.user) {
		req.flash('error', '未登陸！');
		res.redirect('/login');
	}
	next();
}

// check not login
function checkNotLogin(req, res, next) {
	if (req.session.user) {
		req.flash('error', '已登錄！');
		res.redirect('back');
	}
	next();
}

module.exports = router;