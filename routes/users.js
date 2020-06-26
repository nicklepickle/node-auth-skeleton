const express = require('express');
const router = express.Router();
const passport = require('passport');
const config = require("../config");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Models = require('../models');

// GET /users/create
router.get('/create', async(req, res, next) => {
  try {
    res.render('users/create', {
      user: req.user,
      title: 'Create User',
      scripts: ['/scripts/users/create.js']
    });
  }
  catch(err) {
    console.error(err);
    next(err);
  }
});

// POST /users/create
router.post('/create', async(req, res, next) => {
  try {
    if (req.body.password != req.body.confirm || !Models.users.validatePassword(req.body.password)) {
      console.log('invalid password');
      return res.redirect('/users/create?status=422');
    }
    let conflict = await Models.users.findOne({where: {email:req.body.email}});
    if (conflict) {
      console.log('conflict with ' + req.body.email)
      return res.redirect('/users/create?status=409');
    }
    let hash = await bcrypt.hash(req.body.password, config.password.saltrounds);
    let user = {
      nameFirst: req.body.nameFirst,
      nameLast: req.body.nameLast,
      email: req.body.email,
      password: hash
    };
    let data = await Models.users.create(user);
    let createdUser = data.dataValues
    let name = (createdUser.nameFirst + ' ' + createdUser.nameLast).trim();
    console.log('User created');
    console.log(createdUser);

    req.login({
      id:createdUser.userId,
      name:name,
      token:crypto.randomBytes(16).toString("hex")
    }, function(err){
      if(err) {
        return next(err);
      }
      else {
        res.redirect('/');
      }
    });
  }
  catch(err) {
    console.error(err);
    if (err.name == 'SequelizeValidationError') {
      return res.redirect('/users/create?status=422');
    }
    else {
      return res.redirect('/users/create?status=500');
    }
  }
});

// GET /users/login
router.get('/login', async(req, res, next) => {
  try {
    res.render('users/login', {
      user: req.user,
      title: 'Log In',
      scripts: ['/scripts/users/login.js']
    });
  }
  catch(err) {
    console.error(err);
    next(err);
  }
});

// POST /users/login
router.post('/login', async(req, res, next) => {
  // passport.authenticate returns a function to send to the next middleware
  try {
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/users/login?status=401'
    })(req, res, next);
  }
  catch(err) {
    console.error(err);
    next(err);
  }
});

// GET /users/profile
router.get('/profile', async(req, res, next) => {
  try {
    if (!req.user ) {
      return res.redirect('/users/login');
    }
    let profile = await Models.users.findByPk(req.user.id)

    res.render('users/profile', {
      user: req.user,
      title: 'Profile',
      profile: profile,
      scripts: ['/scripts/users/profile.js']
    });
  }
  catch(err) {
    console.error(err);
    next(err);
  }
});

// POST /users/profile
router.post('/profile', async(req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect('/users/login');
    }
    if (req.body.token != req.user.token) {
      console.log('POST contained ' + req.body.token + ' not ' + req.user.token );
      return res.redirect('/users/profile?status=403'); // CSRF
    }
    let conflict = await Models.users.findOne({where: {email:req.body.email}});
    if (conflict && conflict.userId != req.user.id) {
      return res.redirect('/users/profile?status=409');
    }

    let user = {
      nameFirst: req.body.nameFirst,
      nameLast: req.body.nameLast,
      email: req.body.email,
      bio: req.body.bio,
      avatarPath: req.body.avatarPath
    };
    if (user.avatarPath.length > 0 && !Models.users.validateImagePath(user.avatarPath)) {
      return res.redirect('/users/profile?status=415');
    }
    let rows = Models.users.update(user, {where: {userId:req.user.id}});
    if (rows) {
      req.user.name = (req.body.nameFirst + ' ' + req.body.nameLast).trim();
    }
    return res.redirect('/users/profile?status=200');
  }
  catch(err) {
    console.error(err);
    if (err.name == 'SequelizeValidationError') {
      return res.redirect('/users/profile?status=422');
    }
    else {
      return res.redirect('/users/profile?status=500');
    }
  }
});


// GET /users/policy
router.get('/policy', async(req, res, next) => {
  try {
    let policy = Models.users.getPasswordPolicy();

    return res.send({
      message:policy.message,
      expression:policy.expression.toString(),
      minlength:Models.users.passwordConfig.minlength
    });
  }
  catch(err) {
    console.error(err);
    next(err);
  }
});

// GET /users/password
router.get('/password', async(req, res, next) => {
  try {
    if (req.user) {
      res.render('users/password', {
        user: req.user,
        title: 'Reset Password',
        scripts: ['/scripts/users/password.js']
      });
    }
    else {
      return res.redirect('/users/login');
    }

  }
  catch(err) {
    console.error(err);
    next(err);
  }
});

// POST /users/password
router.post('/password', async(req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect('/users/login');
    }
    if (req.body.password != req.body.confirm || !Models.users.validatePassword(req.body.password)) {
      return res.redirect('/users/password?status=422');
    }
    if (req.body.token != req.user.token) {
      console.log('POST contained ' + req.body.token + ' not ' + req.user.token );
      return res.redirect('/users/password?status=403'); // CSRF
    }

    let hash = await bcrypt.hash(req.body.password, config.password.saltrounds);
    let rows = await Models.users.update({password:hash}, {where: {userId:req.user.id}});
    return res.redirect('/users/profile?status=200');
  }
  catch(err) {
    console.error(err);
    next(err);
  }
});


// GET users/logout
router.get('/logout', async(req, res, next) => {
  try {
    if (req.user) {
      console.log('user ' + req.user.id + ' is logging out');
      req.logout();
      req.session.destroy(function (err) {
        return res.redirect('/');
      });
    }
  }
  catch(err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
