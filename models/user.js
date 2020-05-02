const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const config = require('../config');

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    userId: {
      type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true
    },
    nameFirst: {
      type: Sequelize.STRING(32), allowNull: true, validate: {len: [0,32]}
    },
    nameLast: {
      type: Sequelize.STRING(32), allowNull: false, validate: {len: [1,32]}
    },
    email: {
      type: Sequelize.STRING(255), unique: true, allowNull: false, validate: {isEmail:true}
    },
    // this is the hash so no validation
    password: {
      type: Sequelize.STRING(64), allowNull: false
    },
    lastLogin: {
      type: Sequelize.DATE
    },
    loginAttempts: {
      type: Sequelize.INTEGER, allowNull: false, defaultValue: 0
    },
    bio: {
      type: Sequelize.TEXT
    },
    avatarPath: {
      type: Sequelize.STRING
    },
    admin: {
      type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false
    },
    suspended: {
      type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false
    }
  });

  User.passwordConfig = config.password;

  User.passwordPolicies = [ // note the escaped \\'s
    {
      expression:'.+',
      message:'Password is required.'
    },
    {
      expression:'(?=.*[\\d+])(?=.*[a-zA-Z]+)',
      message:'Passwords require letters and numbers.'
    },
    {
      expression:'(?=.*[\\d+])(?=.*[a-zA-Z]+)(?=.*[\\W|_+])',
      message:'Passwords require letters, numbers and non-alphanumeric characters.'
    },
    {
      expression:'(?=.*[\\d+])(?=.*[a-z]+)(?=.*[A-Z]+)(?=.*[\\W|_+])',
      message:'Passwords require upper and lower case letters, numbers and non-alphanumeric characters.'
    }
  ];

  User.getPasswordPolicy = function() {
    let complexity = User.passwordConfig.complexity;
    let max = User.passwordPolicies.length-1;
    if (complexity > max) {
      complexity = max;
    }
    else if (complexity < 0) {
      complexity = 0;
    }
    return policy = User.passwordPolicies[complexity];
  };

  User.validatePassword = function(password) {
    const policy = User.getPasswordPolicy();
    const regex = new RegExp(policy.expression);
    if (password.length < User.passwordConfig.minlength) {
      return false;
    }
    else if (!password.match(regex)) {
      return false;
    }
    return true;
  };

  User.validateImagePath = function(path) {
    return path.match(/^(http:|https:).+\..+\.(gif|png|jpg)$/i);
  };

  User.authStrategy = new LocalStrategy(
    function(username, password, done) {
      console.log(username + ' login attempted');

      User.findOne({where: {
            email:username,
            suspended:false
          }})
        .then(user => {
          let max = User.passwordConfig.maxattempts;
          if (!user) {
            console.log('no valid user matched ' + username);
            return done(null, false, { message: 'Login failed.' });
          }
          else if (max > 1 && user.loginAttempts >= max) {
            console.log('user ' + user.userId + ' account locked');
            return done(null, false, { message: 'Account locked.' });
          }
          bcrypt.compare(password, user.password, function(err, res) {
            if(res) {
              User.update ({
                loginAttempts: 0,
                lastLogin: sequelize.literal('CURRENT_TIMESTAMP')
              },{
                where:{userId: user.userId}
              }).then(count => {
                console.log('user ' + user.userId + ' authenticated');
                let name = (user.nameFirst + ' ' + user.nameLast).trim();
                return done(null, {id:user.userId,name:name});
              });
            }
            else {
              console.log('password incorrect for ' + username);
              User.update ({
                loginAttempts: (user.loginAttempts + 1)
              },{
                where:{userId: user.userId}
              }).then(count => {
                  return done(null, false, { message: 'Login failed.' });
              });
            }
          });
        })
        .catch(err => {
          return done(err);
        });
      }
    );

  return User;
};
