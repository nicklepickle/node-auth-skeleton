# Adding Authentication to an Express Generator Skeleton

## Introduction

Express generator is a node.js application generator tool. It allows you to quickly create an application skeleton using the express web application framework.  It includes a number of useful packages in the skeletal application including options for installing various view and style engines. Express generator will create two routes, index and users.  The index route simply returns the index view with the syntax appropriate for the view engine specified or a static index.html if --no-view is used. The users route contains the following code which responds with the literal content "respond with a resource".

```
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
```

The users route is the starting point for this project which extends an express generator skeleton to provide authentication with help from the passport and bcrypt packages.  Authentication is a complex process that unfortunately neither node, express nor express generator offers much help with.  It can be easy to make small mistakes that can have big consequences in a production application.  This project attempts to provide a starting point for applications requiring authentication by providing a basic implementation with sane defaults which can be modified to suit a developer's needs.  It is only opinionated in its choice of view and database engines, Handlebars and Postgres respectively. *This document will cover other compatible options.*

## Creating the Skeleton

To create a new express web application using express generator, first create the directory and cd to it in a shell. Then install express-generator and use it to create the application skeleton.

```
$nick mkdir node-auth-skeleton
$nick cd node-auth-skeleton
$nick npm install express-generator
$nick express -v hbs
```

## Installing Dependencies

Before installing the dependencies a number of additions need to be made to support passport, bcrypt and Postgres. Passport requires body-parser, express-session and the local policy passport-local.  For Postgres, connect-pg-simple is used to store sessions and sequalized is used as an ORM which requires pg and pg-hstore. Finally helmet is added which helps secure our applications by setting various HTTP headers. These packages can be installed manually or by modifying the package.json file created by express generator as follows.

```
{
  "name": "node-auth-skeleton",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "node ./bin/www"
  },
  "dependencies": {
    "bcrypt": "^5.0.0",
    "body-parser": "^1.19.0",
    "connect-pg-simple": "^6.2.1",
    "cookie-parser": "~1.4.4",
    "debug": "~2.6.9",
    "express": "~4.16.1",
    "express-session": "^1.17.1",
    "hbs": "^4.1.1",
    "helmet": "^3.23.3",
    "http-errors": "~1.6.3",
    "morgan": "~1.9.1",
    "passport": "^0.4.1",
    "passport-local": "^1.0.0",
    "pg": "^8.5.1",
    "pg-hstore": "^2.3.3",
    "sequelize": "^5.22.3"
  }
}

```


Once these dependencies have been declared, install them using npm in a shell.

```
$nick npm install
```

Some information about the installed packages will be displayed followed by "found 0 vulnerabilities". If a vulnerability is found, run a security audit of the installed packages. You can also run an audit anyways just to feel safe. The audit may include instructions on how to resolve any reported vulnerabilities.

```
$nick npm audit
```

## Configuring the Application

The configuration for this application will be stored in the config.js file at the root of the project. This file contains all of the vital security settings for the application along with database credentials. It should be treated carefully and never checked into a public repository. With git this can be done by updating its index.

```
$nick git update-index --assume-unchanged config.js
```

The **database** section of config.js contains connection settings described in the [sequalized manual](https://sequelize.org/v5/manual/getting-started.html).  The **session** section contains **key** which is the name of the session cookie, **secret** used to salt the payload and **secure** which determines if the session cookie should be encrypted. Session cookies should always be set to secure in a production environment. The **password** section contains the following important settings.

```
saltrounds: 10
```

The **saltrounds** setting is the amount of time required to calculate the hash. The higher the cost factor, the more hashing rounds are done.  A cost factor of 10 means that the calculation is done 2^10 times. The more rounds of calculation you need to get the final hash, the more calculation time is necessary. This is no problem for calculating a single hash for a login, but it is a huge problem when you brute-force millions of password combinations.

```
maxattempts: 10
```

The **maxattempts** setting is the number of failed password attempts a user can try before they are locked out of their account.  With this feature a brute-force attack to gain access to a single account is also a huge problem.  The down side is that some valid users will be locked out of their account and will require a method of resetting their credentials.  This is usually done by sending an expiring, one time use token to them via email or text message that allows them access to their password page.  This however is outside of the scope of an application skeleton.  To turn this feature off set **maxattempts** to zero.

```
minlength: 6,
complexity: 1
```

The **minlength** and **complexity** settings define the requirements for a valid password. The **minlength** setting as expected sets the minimum length of a valid password. The **complexity** setting defines the character requirements. With a value of 1 passwords require letters and numbers. With a value of 2 passwords require letters, numbers and non-alphanumeric characters.  With a value of 3 passwords require upper and lower case letters, numbers and non-alphanumeric characters. To turn this feature off set **complexity** to zero.

## Adding the User and Session Models

The session model contains the express-session configuration and setup. The user model contains the ORM mapping for user data which can be extended as needed as well as the methods for handling password policies and authentication.  The important method to note is the passport strategy defined in authStrategy. Passport uses what are termed strategies to authenticate requests. Strategies range from verifying a username and password to delegated authentication using OAuth. The local policy implemented in this project uses a username and password validated against a bcrypt hash stored in Postgres. The user and session models are exported by index.js which also sets up the sequalized connection to Postgres with the values in the config file. They can then be used as follows.

```
const Models = require('./models');
```

*Any database that integrates with express-session and sequalized could be used in this project. Compatible session stores are listed on the [express-session document](https://www.npmjs.com/package/express-session#compatible-session-stores).   Compatible sequalized databases are listed on the [sequalized dialects page](https://sequelize.org/v5/manual/dialects.html). For alternative passport polices browse the [passport policy packages](http://www.passportjs.org/packages/).*

Finally in app.js the new models and packages are required and used by the app.
```
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const passport = require('passport');
const helmet = require('helmet');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const config = require('./config');
const app = express();

const Models = require('./models');
```
...

```
app.use(Models.sessions);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(Models.users.authStrategy);
```

## Users Routes and Views

To come full circle we just need to update the users route which previously only responds with the literal content "respond with a resource". The users route will includes the post and get request handlers for /users/create, /users/login, /users/password, /users/profile and /users/logout.  Get requests will generally return the web form associated with route and post requests will handle the body of the post request and redirect to a logical location with the response status generated by the user's request passed in the status query string. This is done because the actual request status will be 302 due to the redirect.

*This project uses handlebar views for users to create an account, log in, reset their password and update their profile. Handlebars was chosen because it is lightweight and uses standard HTML5 as opposed to a engine specific syntax.  However, these views are simple web forms and could be adapted to any view engine with minimal effort.  Express generator suppports ejs, hjs, jade, pug, twig, and vash as alternatives.  It is also possible to generate an application with --no-view and use any front end framework.  In this project client side validation is done with jquery*.
