var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');

// index
router.get('/', function(req, res) {
	// check is first page, and change the page to number
	var page = parseInt(req.query.p) || 1;
	// query and return 10 post in page
	Post.getTen(null, page, function(err, posts, total) {
		if (err) {
			posts = [];
		}
		res.render('index', {
			title: '主頁',
			posts: posts,
			page: page,
			isFirstPage: (page - 1) == 0,
			isLastPage: ((page - 1) * 10 + posts.length) == total,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

// router.get('/', function(req, res, next) {
// 	Post.getAll(null, function(err, posts) {
// 		if (err) {
// 			posts = [];
// 		}
// 		res.render('index', {
// 			title: '主頁',
// 			user: req.session.user,
// 			posts: posts,
// 			success: req.flash('success').toString(),
// 			error: req.flash('error').toString()
// 		});
// 	});
// });

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
			req.flash('error', '使用者已存在！');
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
	var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
	var post = new Post(currentUser.name, req.body.title, tags, req.body.post);

	post.save(function(err) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		req.flash('success', '發佈成功！');
		res.redirect('/'); // success and redirect to home page
	});
});

// upload
router.get('/upload', checkLogin);
router.get('/upload', function(req, res) {
	res.render('upload', {
		title: '檔案上傳',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});

router.post('/upload', checkLogin);
router.post('/upload', function(req, res) {
	req.flash('success', '檔案上傳成功！');
	res.redirect('/upload');
});

router.get('/archive', function(req, res) {
	Post.getArchive(function(err, posts) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('archieve', {
			title: '存檔',
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

router.get('/tags', function(req, res) {
	Post.getTags(function(err, posts) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('tags', {
			title: '標籤',
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

router.get('/tags/:tag', function(req, res) {
	Post.getTag(req.params.tag, function(err, posts) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('tag', {
			title: 'TAG:' + req.params.tag,
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

router.get('/links', function(req, res) {
	res.render('links', {
		title: '友情連結',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});

router.get('/search', function(req, res) {
	Post.search(req.query.keyword, function(err, posts) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('search', {
			title: "SEARCH:" + req.query.keyword,
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

// query
router.get('/u/:name', function(req, res) {
	var page = parseInt(req.query.p) || 1;
	// check user is exist
	User.get(req.params.name, function(err, user) {
		if (!user) {
			req.flash('error', '使用者不存在！');
			return res.redirect('/');
		}
		// query 10 posts in page
		Post.getTen(user.name, page, function(err, posts, total) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('user', {
				title: user.name,
				posts: posts,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * 10 + posts.length) == total,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
});
// router.get('/u/:name', function(req, res) {
// 	// check user is exist
// 	User.get(req.params.name, function(err, user) {
// 		if (!user) {
// 			req.flash('error', '用戶不存在！');
// 			return res.redirect('/'); // if user isn't exist, redirect to home page
// 		}
// 		// query and return user all article
// 		Post.getAll(user.name, function(err, posts) {
// 			if (err) {
// 				req.flash('error', err);
// 				return res.redirect('/');
// 			}
// 			res.render('user', {
// 				title: user.name,
// 				posts: posts,
// 				user: req.session.user,
// 				success: req.flash('success').toString(),
// 				error: req.flash('error').toString()
// 			});
// 		});
// 	});
// });

router.get('/u/:name/:day/:title', function(req, res) {
	Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('article', {
			title: req.params.title,
			post: post,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

router.post('/u/:name/:day/:title', function(req, res) {
	var date = new Date();
	var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
	var comment = {
		name: req.body.name,
		email: req.body.email,
		website: req.body.website,
		time: time,
		content: req.body.content
	};
	var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);

	newComment.save(function(err) {
		if (err) {
			req.flash('error', err);
			return res.redirect('back');
		}
		req.flash('success', '留言成功');
		res.redirect('back');
	});
});

// edit
router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function(req, res) {
	var currentUser = req.session.user;

	Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
		if (err) {
			req.flash('error', err);
			return res.redirect('back');
		}
		res.render('edit', {
			title: ' 編輯 ',
			post: post,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

// edit - update
router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function(req, res) {
	var currentUser = req.session.user;

	Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err) {
		var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);

		if (err) {
			req.flash('error', err);
			return res.redirect(url); // error, redirect to article page
		}
		req.flash('success', '修改成功！');
		res.redirect(url); // successful, redirect to article page
	});
});

// edit - remove
router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function(req, res) {
	var currentUser = req.session.user;

	Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
		if (err) {
			req.flash('error', err);
			return res.redirect(back);
		}
		req.flash('success', '刪除成功！');
		res.redirect('/');
	});
});

// logout
router.get('/logout', checkLogin);
router.get('/logout', function(req, res, next) {
	req.session.user = null;
	req.flash('success', '登出成功！');
	res.redirect('/'); // redirect to home page, after logout
});

// 404
router.use(function(req, res) {
	res.render('404');
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