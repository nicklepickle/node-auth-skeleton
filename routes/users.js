const express = require('express');
const router = express.Router();
const passport = require('passport');
const config = require("../config");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const Models = require('../models');

// GET /users/create
router.get('/create', function(req, res, next) {
  res.render('users/create', {
    user: req.user,
    title: 'Create User',
    scripts: ['/scripts/users/create.js']
  });
});

// POST /users/create
router.post('/create', function(req, res, next) {
  if (req.body.password != req.body.confirm || !Models.users.validatePassword(req.body.password)) {
    console.log('invalid password');
    return res.redirect('/users/create?status=422');
  }
  Models.users.findOne({where: {email:req.body.email}})
    .then(conflict=> {
      if (conflict) {
        console.log('conflict with ' + req.body.email)
        return res.redirect('/users/create?status=409');
      }
      else {
        bcrypt.hash(req.body.password, config.password.saltrounds, function(err, hash) {
          let user = {
            nameFirst: req.body.nameFirst,
            nameLast: req.body.nameLast,
            email: req.body.email,
            password: hash
          };
          Models.users.create(user)
            .then(data => {
              let createdUser = data.dataValues
              let name = (createdUser.nameFirst + ' ' + createdUser.nameLast).trim();
              console.log('User created');
              console.log(createdUser);

              req.login({id:createdUser.userId,name:name}, function(err){
                if(err) {
                  return next(err);
                }
                else {
                  res.redirect('/');
                }
              });
            })
            .catch(err => {
              console.log(err);
              if (err.name == 'SequelizeValidationError') {
                return res.redirect('/users/create?status=422');
              }
              else {
                return res.redirect('/users/create?status=500');
              }
            });
        });
      }
    })
});

// GET /users/login
router.get('/login', function(req, res, next) {
  res.render('users/login', {
    user: req.user,
    title: 'Log In',
    scripts: ['/scripts/users/login.js']
  });
});

// POST /users/login
router.post('/login', function(req, res, next) {
  // * passport.authenticate returns a function to send to the next middleware
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login?status=401'
  })(req, res, next); // * NOTE
});

// GET /users/profile
router.get('/profile', function(req, res, next) {
  if (req.user ) {
    Models.users.findByPk(req.user.id)
      .then(profile => {
        res.render('users/profile', {
          user: req.user,
          title: 'Profile',
          profile: profile,
          scripts: ['/scripts/users/profile.js']
        });
      })
      .catch(err => {
        return res.send({});
      });
  }
  else {
    return res.redirect('/users/login');
  }
});

// POST /users/profile
router.post('/profile', function(req, res, next) {
  if (req.user) {
    Models.users.findOne({where: {email:req.body.email}})
      .then(conflict=> {
        if (conflict && conflict.userId != req.user.id) {
          return res.redirect('/users/profile?status=409');
        }
        else {
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

          Models.users.update(user, {where: {userId:req.user.id}})
            .then(num => {
              //update session user.name
              let name = (req.body.nameFirst + ' ' + req.body.nameLast).trim();
              req.login({id:req.user.id,name:name}, function(err){
                if(err) {
                  return next(err);
                }
                else {
                  return res.redirect('/users/profile?status=200');
                }
              });

            })
            .catch(err => {
              console.log(err);
              if (err.name == 'SequelizeValidationError') {
                return res.redirect('/users/profile?status=422');
              }
              else {
                return res.redirect('/users/profile?status=500');
              }
            });
          }
      });
  }
  else {
    return res.redirect('/users/login');
  }
});


// GET /users/policy
router.get('/policy', function(req, res, next) {
  let policy = Models.users.getPasswordPolicy();

  return res.send({
    message:policy.message,
    expression:policy.expression.toString(),
    minlength:Models.users.passwordConfig.minlength
  });
});

// GET /users/password
router.get('/password', function(req, res, next) {
  if (req.user) {
    res.render('users/password', {
      user: req.user,
      title: 'Create User',
      scripts: ['/scripts/users/password.js']
    });
  }
  else {
    return res.redirect('/users/login');
  }
});

// POST /users/password
router.post('/password', function(req, res, next) {
  if (req.user) {
    if (req.body.password != req.body.confirm || !Models.users.validatePassword(req.body.password)) {
      return res.redirect('/users/password?status=422');
    }
    else {
      bcrypt.hash(req.body.password, config.password.saltrounds, function(err, hash) {
        Models.users.update({password:hash}, {where: {userId:req.user.id}})
          .then(num => {
            return res.redirect('/users/profile?status=200');
          })
          .catch(err => {
            console.log(err);
            return res.redirect('/users/password?status=422');
          });
      });
    }
  }
  else {
    return res.redirect('/users/login');
  }
});


// GET users/logout
router.get('/logout', function(req, res, next) {
  if (req.user) {
    console.log('user ' + req.user.id + ' is logging out');
    req.logout();
    req.session.destroy();
  }
  return res.redirect('/');
});

module.exports = router;
